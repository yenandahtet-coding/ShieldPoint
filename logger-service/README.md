# Nova Pay Logger Service

This is the first consumer microservice in the distributed Nova Pay architecture (Phase 4).

## Responsibilities
The `logger-service` is an **Event Consumer** whose sole responsibility is connecting to the `transactions` Kafka topic, parsing `TransactionCreatedEvent` messages, and safely persisting them into a PostgreSQL database. 

It does **not** handle fraud detection, notifications, or direct API processing.

## Architecture
- **Language**: Python 3.12
- **Framework**: FastAPI (for lightweight health metrics)
- **Kafka**: `confluent-kafka` (for consumer loops and offset management)
- **Database**: PostgreSQL (via SQLAlchemy 2 and Alembic)
- **Validation**: Pydantic v2

## Offset Management & Retries
To guarantee at-least-once delivery:
- Automatic offset committing is explicitly **disabled**.
- The service will only manually commit offsets when a message has been successfully saved to the database (or if it detects an unrecoverable validation error/malformed JSON, in which case it logs the error and moves on).
- If PostgreSQL goes down, the database transaction will fail. The consumer intercepts this, sleeps with exponential backoff, and attempts to reprocess the *same* message indefinitely until PostgreSQL recovers. The offset is *never* committed if the database is unreachable.

## Getting Started

1. Copy `.env.example` to `.env`
2. Start the infrastructure via Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Initialize the database schema via Alembic:
   ```bash
   alembic upgrade head
   ```
4. Start the service (runs FastAPI on port 8001 and the Consumer thread simultaneously):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

## Endpoints
- `GET /health` : Reports Service metadata, Kafka connection, and Database connection statuses.
- `GET /metrics` : Exposes counters for events received, saved, failed, and duplicated.
