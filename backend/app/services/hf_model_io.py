import os
from huggingface_hub import HfApi, HfFolder, upload_folder
from transformers import AutoModelForCausalLM, AutoTokenizer


class HFModelIO:
    def __init__(self, token: str, user: str):
        self.token = token
        self.user = user
        self.api = HfApi(token=token)
        HfFolder.save_token(token)

    def push_model(self, model_dir: str, repo_name: str, private: bool = True):
        repo_id = f"{self.user}/{repo_name}"
        # Create repo if not exists
        self.api.create_repo(repo_id, private=private, exist_ok=True)
        # Upload all files in model_dir
        upload_folder(
            folder_path=model_dir,
            repo_id=repo_id,
            token=self.token,
            commit_message="Upload fine-tuned model from CodeTune",
        )
        return repo_id

    def download_model(self, repo_id: str, local_dir: str):
        self.api.snapshot_download(
            repo_id=repo_id, local_dir=local_dir, token=self.token
        )
        return local_dir

    def load_model(self, local_dir: str):
        model = AutoModelForCausalLM.from_pretrained(local_dir)
        tokenizer = AutoTokenizer.from_pretrained(local_dir)
        return model, tokenizer
