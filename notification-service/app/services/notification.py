import logging
import uuid
from typing import List, Dict, Any
from collections import deque
from app.schemas.events import FraudDetectedEvent
from app.services.providers import NotificationProvider, ConsoleNotificationProvider

logger = logging.getLogger(__name__)

# In-memory storage for metrics and history
metrics_store = {
    "alerts_received": 0,
    "notifications_sent": 0,
    "notification_failures": 0
}

# Bounded deque to store the last 100 notifications
notification_history = deque(maxlen=100)

class NotificationService:
    def __init__(self, providers: List[NotificationProvider] = None):
        # Defaulting to ConsoleProvider if none supplied
        self.providers = providers if providers else [ConsoleNotificationProvider()]

    def process_alert(self, event: FraudDetectedEvent):
        """
        Process an incoming fraud alert and dispatch it to all registered providers.
        """
        metrics_store["alerts_received"] += 1
        logger.info(f"Notification Received: Processing alert for transaction {event.payload.transactionId}")
        
        notification_id = str(uuid.uuid4())
        
        success_count = 0
        failure_count = 0

        for provider in self.providers:
            success = provider.send(event)
            if success:
                success_count += 1
                metrics_store["notifications_sent"] += 1
            else:
                failure_count += 1
                metrics_store["notification_failures"] += 1
        
        # Save to history
        history_entry = {
            "notificationId": notification_id,
            "eventId": str(event.eventId),
            "transactionId": str(event.payload.transactionId),
            "status": "SENT" if failure_count == 0 else "PARTIAL/FAILED",
            "timestamp": event.timestamp.isoformat()
        }
        notification_history.appendleft(history_entry)

    @classmethod
    def get_metrics(cls) -> Dict[str, int]:
        return metrics_store
        
    @classmethod
    def get_history(cls) -> List[Dict[str, Any]]:
        return list(notification_history)
