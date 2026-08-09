from abc import ABC, abstractmethod
from app.schemas.events import FraudDetectedEvent
import logging

logger = logging.getLogger(__name__)

class NotificationProvider(ABC):
    """
    Abstract base class for all notification providers (Strategy Pattern).
    New providers (e.g. SMTP, Slack, SMS) should inherit from this.
    """
    @abstractmethod
    def send(self, event: FraudDetectedEvent) -> bool:
        pass

class ConsoleNotificationProvider(NotificationProvider):
    """
    A simple provider that logs and prints formatted emails to the console.
    """
    def send(self, event: FraudDetectedEvent) -> bool:
        try:
            logger.info("Provider Selected: ConsoleNotificationProvider")
            
            # Formatting the pseudo-email
            email_content = f"""
---------------------------------------
Subject: 🚨 Fraud Alert Detected

Body:
Transaction ID: {event.payload.transactionId}
Sender ID: {event.payload.senderId}
Risk Level: {event.payload.riskLevel}
Risk Score: {event.payload.riskScore}
Triggered Rules: {', '.join(event.payload.triggeredRules)}
Timestamp: {event.timestamp}
---------------------------------------
"""
            print(email_content)
            logger.info(f"Notification Sent successfully for transaction {event.payload.transactionId}")
            return True
        except Exception as e:
            logger.error(f"Notification Failed for transaction {event.payload.transactionId}: {str(e)}")
            return False
