from fastapi import APIRouter
from app.schemas.metrics import MetricsResponse
from app.services.metrics_tracker import metrics_tracker
from app.mongodb.database import db_client
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    collection = db_client.db["fraud_reports"]
    
    # Counts
    total_fraud = await collection.count_documents({})
    high_risk = await collection.count_documents({"risk_level": "HIGH"})
    medium_risk = await collection.count_documents({"risk_level": "MEDIUM"})
    low_risk = await collection.count_documents({"risk_level": "LOW"})

    # Risk Distribution Aggregation
    distribution_pipeline = [
        {
            "$bucket": {
                "groupBy": "$risk_score",
                "boundaries": [0, 25, 50, 75, 100],
                "default": "Other",
                "output": {"count": {"$sum": 1}}
            }
        }
    ]
    distribution_cursor = collection.aggregate(distribution_pipeline)
    dist_results = await distribution_cursor.to_list(length=None)
    
    # Map buckets
    bucket_map = {0: "0-25", 25: "25-50", 50: "50-75", 75: "75-100", "Other": "Other"}
    risk_dist = []
    for d in dist_results:
        bucket_name = bucket_map.get(d["_id"], str(d["_id"]))
        risk_dist.append({"bucket": bucket_name, "count": d["count"]})

    # Fraud Trend Aggregation (last 7 days for demo)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    trend_pipeline = [
        {"$match": {"timestamp": {"$gte": seven_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "fraud": {"$sum": 1},
            "blocked": {"$sum": {"$cond": [{"$eq": ["$risk_level", "HIGH"]}, 1, 0]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    trend_cursor = collection.aggregate(trend_pipeline)
    trend_results = await trend_cursor.to_list(length=None)
    
    fraud_trend = []
    for t in trend_results:
        # Just show the day name or short date
        day_str = datetime.strptime(t["_id"], "%Y-%m-%d").strftime("%a")
        fraud_trend.append({"day": day_str, "fraud": t["fraud"], "blocked": t["blocked"]})

    return MetricsResponse(
        events_received=metrics_tracker.events_received,
        fraud_detected=total_fraud,
        low_risk=low_risk,
        medium_risk=medium_risk,
        high_risk=high_risk,
        risk_distribution=risk_dist,
        fraud_trend=fraud_trend
    )
