# Nova Pay Fraud Service

This is the Fraud Detection microservice (Phase 5).

## Responsibilities
The `fraud-service` acts as an independent stream processor attached to the `transactions` Kafka topic. It evaluates all incoming transactions through a dedicated **Rule Engine**.
- If a transaction is benign, it is ignored entirely.
- If a transaction is suspicious, it is logged into **MongoDB** and a `FraudDetectedEvent` is published to the `fraud-alerts` Kafka topic.

It does **not** persist normal transactions (that is the job of the `logger-service`). It also does **not** send notifications.

## Architecture
- **Language**: Python 3.12
- **Framework**: FastAPI (for lightweight health metrics)
- **Kafka**: `confluent-kafka` (for consumer loops and alert producing)
- **Database**: MongoDB (via `Motor` async driver)
- **Validation**: Pydantic v2
- **Rule Engine**: Strategy Pattern with isolated rules and in-memory caching.

## Rule Engine Details
The Rule engine uses a Strategy Pattern (`app/rules/base.py`). Each rule evaluates the event and returns a risk score.
Scores are summed up to determine Risk Level:
- `0-29`: LOW
- `30-59`: MEDIUM
- `60-100`: HIGH

## Getting Started

1. Copy `.env.example` to `.env`
2. Start the infrastructure (MongoDB) via Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Start the service (runs FastAPI on port 8002 and the Consumer thread simultaneously):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8002
   ```

## Endpoints
- `GET /health` : Reports Service metadata, Kafka connection, and MongoDB connection statuses.
- `GET /metrics` : Exposes counts for `events_received`, `fraud_detected`, `low_risk`, `medium_risk`, and `high_risk`.
