import asyncio
import logging
import os
import json
import subprocess
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from .tuning_service import TuningService
from .hf_model_io import HFModelIO
from .ollama_service import OllamaService
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
    TrainerCallback,
)

logger = logging.getLogger("tuning_worker")


class TuningWorker:
    def __init__(self, db: AsyncIOMotorDatabase, poll_interval: float = 2.0):
        self.db = db
        self.service = TuningService(db)
        self.poll_interval = poll_interval
        self._running = False
        self.settings_file = os.environ.get("CODETUNE_SETTINGS_FILE", "settings.json")
        logger.info("TuningWorker initialized (not started)")

    def _load_settings(self) -> dict:
        if os.path.exists(self.settings_file):
            with open(self.settings_file, "r") as f:
                return json.load(f)
        return {}

    def train_model(
        self,
        model_dir: str,
        dataset_path: str,
        output_dir: str,
        epochs: int,
        training_steps: int | None = None,
        learning_rate: float | None = None,
        progress_cb: callable | None = None,
    ) -> tuple[float, list[float]]:
        dataset = load_dataset("text", data_files=dataset_path)
        tokenizer = AutoTokenizer.from_pretrained(model_dir)
        model = AutoModelForCausalLM.from_pretrained(model_dir)

        def tokenize(batch):
            return tokenizer(batch["text"], truncation=True)

        tokenized = dataset["train"].map(
            tokenize, batched=True, remove_columns=["text"]
        )

        data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
        args = TrainingArguments(
            output_dir=output_dir,
            per_device_train_batch_size=1,
            num_train_epochs=epochs,
            max_steps=training_steps if training_steps else -1,
            learning_rate=learning_rate if learning_rate else 5e-5,
            logging_steps=10,
            save_strategy="no",
        )

        loss_history: list[float] = []

        class ProgressCallback(TrainerCallback):
            def on_epoch_end(self, args, state, control, **kwargs):
                if progress_cb and state.epoch is not None:
                    pct = float(state.epoch) / float(epochs)
                    progress_cb(pct)

            def on_log(self, args, state, control, logs=None, **kwargs):
                if logs and "loss" in logs:
                    try:
                        loss_history.append(float(logs["loss"]))
                    except Exception:
                        pass

        trainer = Trainer(
            model=model,
            args=args,
            train_dataset=tokenized,
            data_collator=data_collator,
        )

        trainer.add_callback(ProgressCallback())

        trainer.train()
        # Try to extract the final training loss from the Trainer state
        loss = None
        for entry in reversed(trainer.state.log_history):
            if "loss" in entry:
                loss = entry["loss"]
                break

        os.makedirs(output_dir, exist_ok=True)
        model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)
        return float(loss) if loss is not None else 0.0, loss_history

    def convert_to_gguf(self, model_dir: str, gguf_path: str, script: str) -> None:
        cmd = ["python", script, model_dir, gguf_path]
        subprocess.run(cmd, check=True)

    def quantize_gguf(self, gguf_path: str, mode: str, quantize_bin: str = "quantize") -> str:
        """Optionally quantize the GGUF file using llama.cpp quantize utility."""
        out_path = gguf_path.replace(".gguf", f"_{mode}.gguf")
        cmd = [quantize_bin, gguf_path, out_path, mode]
        subprocess.run(cmd, check=True)
        return out_path

    async def run(self):
        self._running = True
        logger.info("TuningWorker started.")
        while self._running:
            try:
                await self.process_queued_tasks()
            except Exception as e:
                logger.error(f"Worker error: {e}")
            await asyncio.sleep(self.poll_interval)

    async def process_queued_tasks(self):
        # Find all queued tasks
        cursor = self.service.collection.find({"status": "queued"})
        async for doc in cursor:
            task_id = doc["_id"]
            logger.info(f"Starting tuning for task {task_id}")
            await self.run_tuning_task(task_id, doc)

    async def run_tuning_task(self, task_id: ObjectId, doc: dict):
        """Run the full fine-tuning and upload pipeline for a task."""
        try:
            settings = self._load_settings()
            hf_token = settings.get("hf_token")
            hf_user = settings.get("hf_user")
            local_dir = settings.get("local_model_dir", "models")

            repo_id = doc["parameters"].get("repo_id")
            name = doc["parameters"].get("name", str(task_id))
            dataset_path = doc.get("dataset_id")
            epochs = int(doc["parameters"].get("epochs", 1))
            training_steps = int(doc["parameters"].get("trainingSteps", 0))
            learning_rate = float(doc["parameters"].get("learningRate", 5e-5))
            quantization = doc["parameters"].get("quantization", "none")
            push = bool(doc["parameters"].get("push", False))
            converter_script = doc["parameters"].get("converter_script", "convert.py")

            if not (hf_token and hf_user and repo_id and dataset_path):
                raise ValueError("Missing required parameters for tuning task")

            await self.service.update_progress(task_id, 0.05, "downloading")
            hf = HFModelIO(hf_token, hf_user)
            model_dir = hf.download_model(repo_id, os.path.join(local_dir, name))

            await self.service.update_progress(task_id, 0.2, "training")
            output_dir = os.path.join(local_dir, f"finetuned_{task_id}")

            async def async_update(pct: float):
                await self.service.update_progress(
                    task_id, 0.2 + pct * 0.4, "training"
                )

            def progress_cb(p: float):
                asyncio.get_event_loop().call_soon_threadsafe(
                    asyncio.create_task, async_update(p)
                )

            loss, history = self.train_model(
                model_dir,
                dataset_path,
                output_dir,
                epochs,
                training_steps,
                learning_rate,
                progress_cb,
            )

            await self.service.update_progress(
                task_id,
                0.6,
                "training_complete",
                result={"loss": loss, "loss_history": history},
            )

            repo_id_pushed = None
            if push:
                repo_id_pushed = hf.push_model(output_dir, name)

            await self.service.update_progress(task_id, 0.7, "converting")
            gguf_path = os.path.join(output_dir, "model.gguf")
            self.convert_to_gguf(output_dir, gguf_path, converter_script)

            quantized_path = None
            if quantization and quantization != "none":
                await self.service.update_progress(task_id, 0.8, "quantizing")
                quantized_path = self.quantize_gguf(gguf_path, quantization)

            await self.service.update_progress(task_id, 0.9, "creating_model")
            modelfile = os.path.join(output_dir, "Modelfile")
            service = OllamaService()
            model_source = quantized_path or gguf_path
            await service.create_model(name, modelfile, model_source)

            result = {
                "gguf_path": gguf_path,
                "model": name,
                "loss": loss,
                "loss_history": history,
                "model_dir": output_dir,
                "quantization": quantization,
            }
            if quantized_path:
                result["quantized_path"] = quantized_path
            if repo_id_pushed:
                result["repo_id"] = repo_id_pushed
            await self.service.update_progress(task_id, 1.0, "completed", result=result)
            logger.info(f"Completed tuning for task {task_id}")
        except Exception as e:
            logger.error(f"Tuning failed for task {task_id}: {e}")
            await self.service.update_progress(
                task_id, 1.0, "failed", result={"error": str(e)}
            )


# Usage example (to be run in an async context, e.g. FastAPI startup):
# from app.core.database import db
# worker = TuningWorker(db)
# asyncio.create_task(worker.run())
