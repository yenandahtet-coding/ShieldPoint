# Nova Pay API Service

This is Phase 2 of the Distributed Financial Transaction Pipeline.
Currently, this service exposes endpoints that successfully validate requests and return mocked responses. Future phases will integrate Kafka and PostgreSQL.

## Stack
- Python 3.12
- FastAPI
- Pydantic v2
- SQLAlchemy 2 & Alembic (Configured, no writes yet)
- Uvicorn
- Docker

## Setup
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Endpoints
- `GET /health`
- `POST /transfer`
- `POST /deposit`
- `POST /withdraw`
- `GET /transactions`
- `GET /wallet`
- `GET /profile`
