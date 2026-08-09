import json
import logging
import time
import threading
from confluent_kafka import Consumer, KafkaError, KafkaException
import os
from dotenv import load_dotenv
from .supabase_client import SupabaseClient

load_dotenv()

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
CONSUMER_GROUP_ID = "wallet-service-group"

class WalletConsumer:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'group.id': CONSUMER_GROUP_ID,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        }
        self.consumer = None
        self.running = False
        self.supabase = SupabaseClient()

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._consume_loop)
        self.thread.daemon = True
        self.thread.start()

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()

    def _consume_loop(self):
        try:
            self.consumer = Consumer(self.conf)
            self.consumer.subscribe(['transactions', 'fraud-alerts'])
            logger.info("WalletConsumer started listening to 'transactions'...")
            
            while self.running:
                msg = self.consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka error: {msg.error()}")
                        break
                
                try:
                    event = json.loads(msg.value().decode('utf-8'))
                    self.process_event(event)
                    self.consumer.commit(asynchronous=False)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    time.sleep(2) # Retry delay
        except KafkaException as e:
            logger.error(f"KafkaException: {e}")
        finally:
            if self.consumer:
                self.consumer.close()
                logger.info("WalletConsumer closed.")

    def process_event(self, event: dict):
        import uuid
        event_type = event.get("eventType")
        correlation_id = event.get("correlationId", str(uuid.uuid4()))
        payload = event.get("payload", {})
        tx_id = payload.get("transactionId")
        amount = payload.get("amount", 0)
        
        logger.info(f"Processing event {event_type} for tx {tx_id}")
        
        if event_type == "TRANSFER_CREATED":
            sender_id = payload.get("senderId")
            receiver_phone = payload.get("receiverPhone")
            
            # 1. Deduct sender
            sender = self.supabase.get_profile_by_id(sender_id)
            if sender:
                new_bal = float(sender.get("balance", 0)) - amount
                self.supabase.update_balance(sender_id, new_bal)
                
            # 2. Add to receiver
            receiver = self.supabase.get_profile_by_phone(receiver_phone)
            if receiver:
                new_bal = float(receiver.get("balance", 0)) + amount
                self.supabase.update_balance(receiver.get("id"), new_bal)
                
            # 3. Log transaction
            self.supabase.insert_transaction({
                "transaction_id": tx_id,
                "sender_id": sender_id,
                "receiver_phone": receiver_phone,
                "amount": amount,
                "currency": "MMK",
                "status": "COMPLETED",
                "note": payload.get("note", "Transfer"),
                "event_id": str(uuid.uuid4()),
                "correlation_id": correlation_id
            })
            
        elif event_type == "DEPOSIT_CREATED":
            receiver_id = payload.get("senderId") # The one depositing is the sender in payload
            amount = payload.get("amount", 0)
            
            receiver = self.supabase.get_profile_by_id(receiver_id)
            if receiver:
                new_bal = float(receiver.get("balance", 0)) + amount
                self.supabase.update_balance(receiver_id, new_bal)
                
            self.supabase.insert_transaction({
                "transaction_id": tx_id,
                "sender_id": "system_deposit",
                "receiver_phone": receiver.get("phone") if receiver else "unknown",
                "amount": amount,
                "currency": "MMK",
                "status": "COMPLETED",
                "note": payload.get("note", "Deposit"),
                "event_id": str(uuid.uuid4()),
                "correlation_id": correlation_id
            })
            
        elif event_type == "WITHDRAW_CREATED":
            sender_id = payload.get("senderId")
            amount = payload.get("amount", 0)
            
            sender = self.supabase.get_profile_by_id(sender_id)
            if sender:
                new_bal = float(sender.get("balance", 0)) - amount
                self.supabase.update_balance(sender_id, new_bal)
                
            self.supabase.insert_transaction({
                "transaction_id": tx_id,
                "sender_id": sender_id,
                "receiver_phone": "system_withdraw",
                "amount": amount,
                "currency": "MMK",
                "status": "COMPLETED",
                "note": payload.get("note", "Withdraw"),
                "event_id": str(uuid.uuid4()),
                "correlation_id": correlation_id
            })
            
        elif event_type == "FRAUD_DETECTED":
            # Just update the transaction status to FLAGGED
            # We don't revert balances yet for simplicity
            self.supabase.update_transaction_status(tx_id, "FLAGGED")
            logger.warning(f"Transaction {tx_id} marked as FLAGGED in database due to fraud alert.")

consumer_worker = WalletConsumer()
