from fastapi import APIRouter

router = APIRouter()

# Simple in-memory tracker for api-service
metrics_store = {
    "transactions_processed": 0,
}

def increment_transaction():
    metrics_store["transactions_processed"] += 1

@router.get("/metrics")
def get_metrics():
    return metrics_store
