import time
from collections import deque, defaultdict
from typing import Tuple
from app.rules.base import FraudRule
from app.schemas.events import TransactionCreatedEvent

class LargeAmountRule(FraudRule):
    @property
    def name(self) -> str:
        return "Transaction amount > 5,000,000 MMK"
        
    def evaluate(self, event: TransactionCreatedEvent) -> Tuple[int, bool]:
        if event.payload.amount >= 5000000:
            return 40, True
        return 0, False

class BlacklistedReceiverRule(FraudRule):
    def __init__(self):
        # Simple in-memory blacklist for Phase 5
        self.blacklist = {"09111111111", "09999999999"}
        
    @property
    def name(self) -> str:
        return "Receiver is on a blacklist"
        
    def evaluate(self, event: TransactionCreatedEvent) -> Tuple[int, bool]:
        if event.payload.receiverPhone in self.blacklist:
            return 50, True
        return 0, False

class OutsideBusinessHoursRule(FraudRule):
    @property
    def name(self) -> str:
        return "Transfer occurs outside business hours"
        
    def evaluate(self, event: TransactionCreatedEvent) -> Tuple[int, bool]:
        # Using UTC for simplicity, in a real app this would use localized time
        hour = event.timestamp.hour
        # Outside business hours: before 6 AM or after 10 PM
        if hour < 6 or hour > 22:
            return 20, True
        return 0, False

# Stateful cache for frequency rules
# Structure: { senderId: deque([timestamp1, timestamp2, ...]) }
sender_history_cache = defaultdict(deque)

class HighFrequencyRule(FraudRule):
    @property
    def name(self) -> str:
        return "More than 5 transactions within 1 minute"
        
    def evaluate(self, event: TransactionCreatedEvent) -> Tuple[int, bool]:
        sender_id = event.payload.senderId
        now = time.time()
        
        history = sender_history_cache[sender_id]
        history.append(now)
        
        # Remove timestamps older than 60 seconds
        while history and now - history[0] > 60:
            history.popleft()
            
        if len(history) > 5:
            return 30, True
        return 0, False

class RapidConsecutiveTransfersRule(FraudRule):
    @property
    def name(self) -> str:
        return "Rapid consecutive transfers from the same sender"
        
    def evaluate(self, event: TransactionCreatedEvent) -> Tuple[int, bool]:
        sender_id = event.payload.senderId
        history = sender_history_cache[sender_id]
        
        # This rule checks if there are 3 transfers in less than 5 seconds
        if len(history) >= 3:
            # Check the difference between the newest and the 3rd newest
            if history[-1] - history[-3] < 5:
                return 20, True
        return 0, False
