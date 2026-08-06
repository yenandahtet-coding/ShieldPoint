from app.schemas.transaction import TransactionRequest, TransactionResponse
from app.schemas.events import TransactionCreatedEvent, TransactionPayload
from app.config.topics import KafkaTopics
from app.utils.kafka_producer import publish_event
import uuid
import logging

logger = logging.getLogger(__name__)

class TransactionService:
    @staticmethod
    def _publish_transaction_event(event_type: str, request: TransactionRequest) -> TransactionResponse:
        transaction_id = uuid.uuid4()
        correlation_id = uuid.uuid4()
        
        # Build the payload with business data only (excluding PIN)
        payload = TransactionPayload(
            transactionId=transaction_id,
            senderId=request.senderId,
            receiverPhone=request.receiverPhone,
            merchantId=request.merchantId,
            amount=request.amount,
            note=request.note
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
