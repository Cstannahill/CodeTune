import os
import json
import shutil
from fastapi import UploadFile


class DatasetService:
    def __init__(self):
        self.settings_file = os.environ.get("CODETUNE_SETTINGS_FILE", "settings.json")
        self.dataset_dir = self._load_dir()

    def _load_dir(self) -> str:
        if os.path.exists(self.settings_file):
            with open(self.settings_file, "r") as f:
                data = json.load(f)
                return data.get("dataset_dir", "datasets")
        return "datasets"

    def save_dataset(self, file: UploadFile) -> str:
        os.makedirs(self.dataset_dir, exist_ok=True)
        path = os.path.join(self.dataset_dir, file.filename)
        with open(path, "wb") as dest:
            shutil.copyfileobj(file.file, dest)
        return path

    def list_datasets(self) -> list[str]:
        if not os.path.exists(self.dataset_dir):
            return []
        return [f for f in os.listdir(self.dataset_dir) if os.path.isfile(os.path.join(self.dataset_dir, f))]
