# CodeTune Backend

This backend is built with [FastAPI](https://fastapi.tiangolo.com/) and uses MongoDB via the async Motor driver.

## Structure

- `app/main.py` - application entrypoint
- `app/core` - configuration and database modules
- `app/api` - all API routes grouped by version
- `app/services` - business logic and database interactions
- `app/schemas` - Pydantic models used for requests and responses

### Ollama Integration

Ollama is used for running local models. Fine-tune a base model using external
tools (e.g. Hugging Face Transformers, PEFT or Unsloth), then convert the
resulting checkpoint to the GGUF format with `llama.cpp`. Create a `Modelfile`
that references the GGUF file:

```text
FROM ./path/to/your-model.gguf
TEMPLATE """{{ if .System }}\n{{ .System }}\n{{ end }}\n{{ .Prompt }}"""
```

Load the model into Ollama with:

```bash
ollama create mymodel -f Modelfile
```

### Fine-tuning workflow

The typical workflow to fine-tune and serve a model locally is:

1. **Download a base model** from HuggingFace using `POST /api/v1/models/pull`.
2. **Run a tuning task** with `POST /api/v1/tuning/` providing dataset and
   training parameters.
3. After training, convert the resulting checkpoint to **GGUF** and create a
   minimal `Modelfile` referencing it.
4. **Create the Ollama model** by calling `POST /api/v1/ollama/create` with the
   model name and path to the Modelfile (or GGUF file).

Once created, the model can be listed with `/api/v1/ollama/models` and used for
chat completions via `/api/v1/ollama/chat`.

### Dataset Upload

Datasets can be uploaded via `POST /api/v1/datasets/upload` which accepts a
file. Uploaded datasets are stored under the directory configured in the
settings file (defaults to `datasets`). They can be listed with
`GET /api/v1/datasets/`.

The API exposes the following new endpoints:

- `GET /api/v1/ollama/models` - list locally available models
- `POST /api/v1/ollama/pull` - download a model
- `POST /api/v1/ollama/chat` - generate chat completions using a model

### New Endpoints

- `POST /api/v1/user-models/` - save parameters and results as a model
- `POST /api/v1/user-models/import/{model_id}` - start a new tuning job from a saved model
- `GET /api/v1/user-models/` - list saved models

### Command line pipeline

A helper script `scripts/hf_ollama_pipeline.py` automates the full workflow. It
downloads a base model, optionally fine-tunes it on a text dataset, converts the
result to GGUF, and loads it into Ollama:

```bash
python scripts/hf_ollama_pipeline.py <repo_id> <hf_token> <hf_user> <name> Modelfile \
  --dataset train.txt --epochs 1 --push
```

The script requires the `llama.cpp` `convert.py` utility to be available (use
`--converter-script` to specify its path).

### Background tuning worker

When the backend starts it launches a background `TuningWorker` that watches for
queued tuning tasks. Each task should contain Hugging Face credentials and a
`repo_id`, along with training parameters. The worker downloads the base model,
fine-tunes it on the provided dataset, converts the result to GGUF and finally
creates the Ollama model. Progress can be polled via `/api/v1/tuning/{id}/progress`.

## Development

Create a `.env` file (see `.env.example`) or set the following environment variables:

```
MONGODB_URI=mongodb+srv://cstannahill10:<db_password>@c0.ti97tni.mongodb.net/?retryWrites=true&w=majority&appName=c0
MONGODB_DB=codetune
OPENAI_API_KEY=<your_openai_api_key>
HUGGINGFACE_TOKEN=<your_huggingface_token>
```

Install dependencies and start the server:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
