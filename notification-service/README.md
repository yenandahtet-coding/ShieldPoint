# Notification Service

The `notification-service` is an independent Kafka Consumer microservice in the Nova Pay ecosystem. Its sole responsibility is to react to `fraud-alerts` and dispatch notifications to administrators.

## Architecture

This service follows **Clean Architecture** principles and implements the **Strategy Pattern** for notification dispatch.
- **Database**: None. This service operates purely on Kafka events and maintains an in-memory queue for recent history.
- **Providers**: The core logic depends on the `NotificationProvider` abstraction. Currently, it uses `ConsoleNotificationProvider` to simulate email sending to the console. In the future, replacing this with `SMTPNotificationProvider` or `SlackNotificationProvider` requires zero changes to the core engine.

## API Endpoints

- `GET /health` - Checks service status and Kafka TCP connectivity.
- `GET /metrics` - Returns in-memory counts of alerts received and notifications sent.
- `GET /history` - Returns a JSON array of the last 100 notifications processed.

## Running Locally

1. Create a virtual environment and install dependencies:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
2. Start the service:
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8003
   ```
