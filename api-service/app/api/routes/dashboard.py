from fastapi import APIRouter
from typing import Dict, List
import asyncpg
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import os

router = APIRouter()

motor_client = AsyncIOMotorClient(settings.MONGODB_URL)
mongo_db = motor_client[settings.MONGODB_DB_NAME]

async def get_pg_connection():
    # Parse DATABASE_URL explicitly inside route
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres.vbrptxkiegiqxpirgfhv:5KPfIBWn6aV7RwHF@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
    return await asyncpg.connect(db_url, statement_cache_size=0)

@router.get("/summary")
async def get_dashboard_summary() -> Dict:
    pg_conn = None
    total = 0
    try:
        pg_conn = await get_pg_connection()
        total = await pg_conn.fetchval("SELECT COUNT(*) FROM transactions")
    except Exception as e:
        print("PG count error:", e)
    finally:
        if pg_conn:
            await pg_conn.close()

    fraud_count = await mongo_db.fraud_reports.count_documents({})

    return {
        "totalTransactions": total,
        "fraudDetected": fraud_count,
        "legitimate": total - fraud_count if total > fraud_count else total,
        "avgRiskScore": 2.1,
        "activeConsumers": 2,
        "kafkaStatus": "Online",
        "apiStatus": "Healthy",
        "dbStatus": "Connected"
    }

@router.get("/transactions")
async def get_recent_transactions() -> List[Dict]:
    pg_conn = None
    results = []
    try:
        pg_conn = await get_pg_connection()
        rows = await pg_conn.fetch("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 60")
        for d in rows:
            sender = d.get("sender_id") or ""
            results.append({
                "id": str(d.get("transaction_id")),
                "customer": str(sender)[:8] if sender else "Unknown",
                "account": "Wallet",
                "amount": float(d.get("amount", 0)),
                "currency": d.get("currency"),
                "location": "Protected",
                "merchant": "Transfer",
                "timestamp": d.get("created_at").timestamp() * 1000 if d.get("created_at") else 0,
                "riskScore": 1,
                "status": d.get("status")
            })
    except Exception as e:
        print("PG transactions error:", e)
    finally:
        if pg_conn:
            await pg_conn.close()
    return results

@router.get("/frauds")
async def get_fraud_alerts() -> List[Dict]:
    cursor = mongo_db.fraud_reports.find().sort("timestamp", -1).limit(60)
    reports = await cursor.to_list(length=60)
    results = []

    amounts_map = {}
    pg_conn = None
    try:
        pg_conn = await get_pg_connection()
        tx_ids = [str(r.get("transaction_id")) for r in reports if r.get("transaction_id")]
        if tx_ids:
            rows = await pg_conn.fetch("SELECT transaction_id, amount FROM transactions WHERE transaction_id::text = ANY($1::text[])", tx_ids)
            for row in rows:
                amounts_map[str(row["transaction_id"])] = float(row["amount"])
    except Exception as e:
        print("PG amount fetch error:", e)
    finally:
        if pg_conn:
            await pg_conn.close()

    for r in reports:
        sender = r.get("sender_id") or ""
        rules = r.get("triggered_rules", [])
        dt_val = r.get("timestamp")
        millis = dt_val.timestamp() * 1000 if dt_val else 0
        tx_id = str(r.get("transaction_id", ""))
        results.append({
            "id": r.get("fraud_id"),
            "customer": str(sender)[:8] if sender else "Unknown",
            "amount": amounts_map.get(tx_id, 0),
            "country": "MM",
            "reason": ', '.join([(rule.get("rule_name") if isinstance(rule, dict) else str(rule)) for rule in rules]) if rules else "Unknown Rule",
            "riskScore": r.get("risk_score"),
            "time": millis
        })
    return results
