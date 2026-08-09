import os
import httpx
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") # MUST USE SERVICE_ROLE KEY!

class SupabaseClient:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.warning("Supabase SUPABASE_SERVICE_ROLE_KEY is not set! Balance updates will fail.")
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self.client = httpx.Client(base_url=SUPABASE_URL, headers=self.headers)

    def get_profile_by_id(self, profile_id: str) -> Optional[Dict[str, Any]]:
        url = f"/rest/v1/profiles?id=eq.{profile_id}&select=*"
        response = self.client.get(url)
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]
        return None

    def get_profile_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        url = f"/rest/v1/profiles?phone=eq.{phone}&select=*"
        response = self.client.get(url)
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]
        return None

    def update_balance(self, profile_id: str, new_balance: float) -> bool:
        url = f"/rest/v1/profiles?id=eq.{profile_id}"
        payload = {"balance": new_balance}
        response = self.client.patch(url, json=payload)
        if response.status_code in [200, 204] and len(response.json()) > 0:
            return True
        logger.error(f"Failed to update balance for {profile_id}: {response.text}")
        return False

    def insert_transaction(self, transaction: Dict[str, Any]) -> bool:
        url = "/rest/v1/transactions"
        response = self.client.post(url, json=transaction)
        if response.status_code in [201, 200]:
            return True
        if "duplicate key value violates unique constraint" in response.text or response.status_code == 409:
            logger.info(f"Transaction {transaction.get('transaction_id')} already exists.")
            return True
        logger.error(f"Failed to insert transaction {transaction.get('transaction_id')}: {response.text}")
        return False

    def update_transaction_status(self, transaction_id: str, status: str) -> bool:
        url = f"/rest/v1/transactions?transaction_id=eq.{transaction_id}"
        payload = {"status": status}
        response = self.client.patch(url, json=payload)
        if response.status_code in [200, 204]:
            return True
        logger.error(f"Failed to update transaction status for {transaction_id}: {response.text}")
        return False

