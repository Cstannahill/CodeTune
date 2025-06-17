import argparse
import asyncio
import os
import sys
import subprocess
from typing import Optional

from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
)

SCRIPT_DIR = os.path.dirname(__file__)
sys.path.append(os.path.join(SCRIPT_DIR, ".."))

# minimal env vars so importing the app package succeeds
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017")
os.environ.setdefault("OPENAI_API_KEY", "dummy")

import importlib.util

HF_PATH = os.path.join(SCRIPT_DIR, "..", "app", "services", "hf_model_io.py")
OLLAMA_PATH = os.path.join(SCRIPT_DIR, "..", "app", "services", "ollama_service.py")

spec = importlib.util.spec_from_file_location("hf_model_io", HF_PATH)
hf_model_io = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hf_model_io)  # type: ignore
HFModelIO = hf_model_io.HFModelIO

spec = importlib.util.spec_from_file_location("ollama_service", OLLAMA_PATH)
ollama_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ollama_mod)  # type: ignore
OllamaService = ollama_mod.OllamaService


def parse_args():
    p = argparse.ArgumentParser(
        description=(
            "Download a model, optionally fine-tune it and load the result into Ollama"
        )
    )
    p.add_argument("repo_id", help="HuggingFace repository id")
    p.add_argument("hf_token", help="HuggingFace token")
    p.add_argument("hf_user", help="HuggingFace username or org")
    p.add_argument("name", help="Name for the Ollama model")
    p.add_argument(
        "modelfile", help="Path to write the Modelfile referencing the GGUF file"
    )
    p.add_argument(
        "--local-dir", default="./models", help="Directory to download the model"
    )
    p.add_argument(
        "--dataset",
        help="Optional dataset path for fine-tuning (plain text with one sample per line)",
    )
    p.add_argument(
        "--output-dir",
        default="./finetuned",
        help="Directory to save the fine-tuned model",
    )
    p.add_argument(
        "--epochs",
        type=int,
        default=1,
        help="Number of training epochs for fine-tuning",
    )
    p.add_argument(
        "--gguf-path",
        default=None,
        help="Where to write the converted GGUF model (default: <output-dir>/model.gguf)",
    )
    p.add_argument(
        "--push",
        action="store_true",
        help="Push the fine-tuned model back to HuggingFace",
    )
    p.add_argument(
        "--converter-script",
        default="convert.py",
        help="Path to llama.cpp convert.py script",
    )
    return p.parse_args()


def train_model(model_dir: str, dataset_path: str, output_dir: str, epochs: int) -> None:
    """Fine-tune a causal LM on a simple text dataset."""
    dataset = load_dataset("text", data_files=dataset_path)
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForCausalLM.from_pretrained(model_dir)

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True)

    tokenized = dataset["train"].map(tokenize, batched=True, remove_columns=["text"])

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
    os.makedirs(output_dir, exist_ok=True)
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)


def convert_to_gguf(model_dir: str, gguf_path: str, script: str) -> None:
    """Run llama.cpp convert.py to produce a GGUF file."""
    cmd = ["python", script, model_dir, gguf_path]
    subprocess.run(cmd, check=True)


async def main():
    args = parse_args()
    hf = HFModelIO(args.hf_token, args.hf_user)
    model_dir = hf.download_model(
        args.repo_id, os.path.join(args.local_dir, args.name)
    )
    print(f"Model downloaded to {model_dir}")

    output_dir = args.output_dir
    if args.dataset:
        train_model(model_dir, args.dataset, output_dir, args.epochs)
        model_dir = output_dir
        print(f"Fine-tuned model saved to {output_dir}")

        if args.push:
            repo_id = hf.push_model(output_dir, args.name)
            print(f"Pushed fine-tuned model to {repo_id}")

    gguf_path = args.gguf_path or os.path.join(output_dir, "model.gguf")
    convert_to_gguf(model_dir, gguf_path, args.converter_script)

    service = OllamaService()
    await service.create_model(args.name, args.modelfile, gguf_path)
    print(f"Created Ollama model {args.name}")


if __name__ == "__main__":
    asyncio.run(main())
