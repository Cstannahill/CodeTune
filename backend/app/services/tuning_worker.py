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
        self, model_dir: str, dataset_path: str, output_dir: str, epochs: int
    ) -> float:
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
            logging_steps=10,
            save_strategy="no",
        )

        trainer = Trainer(
            model=model,
            args=args,
            train_dataset=tokenized,
            data_collator=data_collator,
        )

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
        return float(loss) if loss is not None else 0.0

    def convert_to_gguf(self, model_dir: str, gguf_path: str, script: str) -> None:
        cmd = ["python", script, model_dir, gguf_path]
        subprocess.run(cmd, check=True)

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
            push = bool(doc["parameters"].get("push", False))
            converter_script = doc["parameters"].get("converter_script", "convert.py")

            if not (hf_token and hf_user and repo_id and dataset_path):
                raise ValueError("Missing required parameters for tuning task")

            await self.service.update_progress(task_id, 0.05, "downloading")
            hf = HFModelIO(hf_token, hf_user)
            model_dir = hf.download_model(repo_id, os.path.join(local_dir, name))

            await self.service.update_progress(task_id, 0.2, "training")
            output_dir = os.path.join(local_dir, f"finetuned_{task_id}")
            loss = self.train_model(model_dir, dataset_path, output_dir, epochs)

            await self.service.update_progress(
                task_id, 0.6, "training_complete", result={"loss": loss}
            )

            repo_id_pushed = None
            if push:
                repo_id_pushed = hf.push_model(output_dir, name)

            await self.service.update_progress(task_id, 0.7, "converting")
            gguf_path = os.path.join(output_dir, "model.gguf")
            self.convert_to_gguf(output_dir, gguf_path, converter_script)

            await self.service.update_progress(task_id, 0.9, "creating_model")
            modelfile = os.path.join(output_dir, "Modelfile")
            service = OllamaService()
            await service.create_model(name, modelfile, gguf_path)

            result = {"gguf_path": gguf_path, "model": name, "loss": loss}
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
