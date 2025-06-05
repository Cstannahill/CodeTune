# CodeTune Backend

This backend is built with [FastAPI](https://fastapi.tiangolo.com/) and uses MongoDB via the async Motor driver.

## Structure

- `app/main.py` - application entrypoint
- `app/core` - configuration and database modules
- `app/api` - all API routes grouped by version
- `app/services` - business logic and database interactions
- `app/schemas` - Pydantic models used for requests and responses

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
