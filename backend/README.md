# CodeTune Backend

This backend is built with [FastAPI](https://fastapi.tiangolo.com/) and uses MongoDB via the async Motor driver.

## Structure

- `app/main.py` - application entrypoint
- `app/core` - configuration and database modules
- `app/api` - all API routes grouped by version
- `app/services` - business logic and database interactions
- `app/schemas` - Pydantic models used for requests and responses

## Development

Create a `.env` file or set the following environment variables:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=codetune
```

Install dependencies and start the server:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
