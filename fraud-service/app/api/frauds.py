from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from app.mongodb.database import db_client
from bson import json_util
import json

router = APIRouter()

@router.get("/frauds")
async def get_frauds(
    page: int = Query(1, ge=1), 
    limit: int = Query(20, ge=1, le=100)
):
    try:
        collection = db_client.db["fraud_reports"]
        skip = (page - 1) * limit
        cursor = collection.find().sort("timestamp", -1).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        
        result = []
        for doc in documents:
            result.append({
                "fraud_id": doc.get("fraud_id"),
                "transaction_id": doc.get("transaction_id"),
                "sender_id": doc.get("sender_id"),
                "risk_score": doc.get("risk_score"),
                "risk_level": doc.get("risk_level"),
                "triggered_rules": doc.get("triggered_rules", []),
                "timestamp": doc.get("timestamp").isoformat() if doc.get("timestamp") else "",
                "correlation_id": doc.get("correlation_id")
            })
        return result
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@router.get("/frauds/{transaction_id}")
async def get_fraud(transaction_id: str):
    try:
        collection = db_client.db["fraud_reports"]
        doc = await collection.find_one({"transaction_id": transaction_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Fraud report not found")
        
        return {
            "fraud_id": doc.get("fraud_id"),
            "transaction_id": doc.get("transaction_id"),
            "sender_id": doc.get("sender_id"),
            "risk_score": doc.get("risk_score"),
            "risk_level": doc.get("risk_level"),
            "triggered_rules": doc.get("triggered_rules", []),
            "timestamp": doc.get("timestamp").isoformat() if doc.get("timestamp") else "",
            "correlation_id": doc.get("correlation_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
