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

    # Fetch all records to process in Python to avoid MongoDB Atlas Free Tier limitations
    cursor = collection.find({})
    all_reports = await cursor.to_list(length=None)

    # 1. Risk Distribution
    risk_dist_map = {"0-25": 0, "25-50": 0, "50-75": 0, "75-100": 0, "Other": 0}
    for r in all_reports:
        score = r.get("risk_score", 0)
        if 0 <= score < 25:
            risk_dist_map["0-25"] += 1
        elif 25 <= score < 50:
            risk_dist_map["25-50"] += 1
        elif 50 <= score < 75:
            risk_dist_map["50-75"] += 1
        elif 75 <= score < 100:
            risk_dist_map["75-100"] += 1
        else:
            risk_dist_map["Other"] += 1
            
    risk_dist = [{"bucket": k, "count": v} for k, v in risk_dist_map.items()]

    # 2. Fraud Trend (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    trend_map = {}
    for r in all_reports:
        ts = r.get("timestamp")
        if not ts: continue
        # Ensure timezone-aware
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        if ts >= seven_days_ago:
            day_str = ts.strftime("%Y-%m-%d")
            if day_str not in trend_map:
                trend_map[day_str] = {"fraud": 0, "blocked": 0}
            trend_map[day_str]["fraud"] += 1
            if r.get("risk_level") == "HIGH":
                trend_map[day_str]["blocked"] += 1

    fraud_trend = []
    for day_str in sorted(trend_map.keys()):
        day_name = datetime.strptime(day_str, "%Y-%m-%d").strftime("%a")
        fraud_trend.append({"day": day_name, "fraud": trend_map[day_str]["fraud"], "blocked": trend_map[day_str]["blocked"]})

    # 3. Fraud by country
    country_map = {}
    for r in all_reports:
        country = r.get("country") or "Unknown"
        country_map[country] = country_map.get(country, 0) + 1
        
    by_country = [{"country": k, "fraud": v} for k, v in country_map.items()]

    return MetricsResponse(
        events_received=metrics_tracker.events_received,
        fraud_detected=total_fraud,
        low_risk=low_risk,
        medium_risk=medium_risk,
        high_risk=high_risk,
        risk_distribution=risk_dist,
        fraud_trend=fraud_trend,
        by_country=by_country
    )
