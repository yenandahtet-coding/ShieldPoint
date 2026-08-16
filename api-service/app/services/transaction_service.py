from app.schemas.transaction import TransactionRequest, TransactionResponse
from app.schemas.events import TransactionCreatedEvent, TransactionPayload
from app.config.topics import KafkaTopics
from app.utils.kafka_producer import publish_event
import uuid
import logging
import httpx
import os
from fastapi import HTTPException
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class TransactionService:
    @staticmethod
    def _check_frozen_status(sender_id: str, receiver_phone: str = None):
        load_dotenv()
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase config missing in transaction_service.py")
            return
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
        }
        
        if sender_id:
            try:
                res = httpx.get(f"{supabase_url}/rest/v1/profiles?id=eq.{sender_id}&select=status", headers=headers)
                if res.status_code == 200 and len(res.json()) > 0:
                    status = res.json()[0].get("status")
                    if status == "FROZEN":
                        raise HTTPException(status_code=403, detail="Sender account is frozen")
            except httpx.RequestError as e:
                pass

        if receiver_phone:
            try:
                res = httpx.get(f"{supabase_url}/rest/v1/profiles?phone=eq.{receiver_phone}&select=status", headers=headers)
                if res.status_code == 200 and len(res.json()) > 0:
                    if res.json()[0].get("status") == "FROZEN":
                        raise HTTPException(status_code=403, detail="Receiver account is frozen")
            except httpx.RequestError as e:
                logger.error(f"Error checking receiver status: {e}")

    @staticmethod
    def _publish_transaction_event(event_type: str, request: TransactionRequest) -> TransactionResponse:
        TransactionService._check_frozen_status(request.senderId, request.receiverPhone)
        
        transaction_id = uuid.uuid4()
        correlation_id = uuid.uuid4()
        
        # Build the payload with business data only (excluding PIN)
        payload = TransactionPayload(
            transactionId=transaction_id,
            senderId=request.senderId,
            receiverPhone=request.receiverPhone,
            merchantId=request.merchantId,
            amount=request.amount,
            note=request.note,
            country=request.country
        )
        
        # Build the strictly-typed event envelope
        event = TransactionCreatedEvent(
            eventType=event_type,
            correlationId=correlation_id,
            payload=payload
        )
        
        # Publish to Kafka using the model's built-in JSON serialization
        logger.info(f"Publishing {event_type} event to Kafka for transaction {transaction_id}")
        publish_event(KafkaTopics.TRANSACTIONS, str(transaction_id), event.model_dump_json())
        
        return TransactionResponse(
            transactionId=str(transaction_id),
            status="ACCEPTED",
            message=f"{event_type.replace('_', ' ').title()} received and queued."
        )

    @staticmethod
    def process_transfer(request: TransactionRequest) -> TransactionResponse:
        return TransactionService._publish_transaction_event("TRANSFER_CREATED", request)

    @staticmethod
    def process_deposit(request: TransactionRequest) -> TransactionResponse:
        return TransactionService._publish_transaction_event("DEPOSIT_CREATED", request)

    @staticmethod
    def process_withdraw(request: TransactionRequest) -> TransactionResponse:
        return TransactionService._publish_transaction_event("WITHDRAW_CREATED", request)

    @staticmethod
    def get_transactions(user_id: str):
        return []
