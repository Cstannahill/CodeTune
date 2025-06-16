import argparse
import asyncio
import os
import sys

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
    p = argparse.ArgumentParser(description="Download a model from HuggingFace and load it into Ollama")
    p.add_argument("repo_id", help="HuggingFace repository id")
    p.add_argument("hf_token", help="HuggingFace token")
    p.add_argument("hf_user", help="HuggingFace username or org")
    p.add_argument("name", help="Name for the Ollama model")
    p.add_argument("gguf_path", help="Path to the GGUF file produced after fine-tuning")
    p.add_argument("modelfile", help="Path to write the temporary Modelfile")
    p.add_argument("--local-dir", default="./models", help="Directory to download the model")
    return p.parse_args()


async def main():
    args = parse_args()
    hf = HFModelIO(args.hf_token, args.hf_user)
    local_path = hf.download_model(args.repo_id, os.path.join(args.local_dir, args.name))
    print(f"Model downloaded to {local_path}")

    service = OllamaService()
    await service.create_model(args.name, args.modelfile, args.gguf_path)
    print(f"Created Ollama model {args.name}")


if __name__ == "__main__":
    asyncio.run(main())
