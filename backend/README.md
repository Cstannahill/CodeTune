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

The API exposes the following new endpoints:

- `GET /api/v1/ollama/models` - list locally available models
- `POST /api/v1/ollama/pull` - download a model
- `POST /api/v1/ollama/chat` - generate chat completions using a model

### New Endpoints

- `POST /api/v1/user-models/` - save parameters and results as a model
- `POST /api/v1/user-models/import/{model_id}` - start a new tuning job from a saved model
- `GET /api/v1/user-models/` - list saved models

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
