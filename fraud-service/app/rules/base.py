from abc import ABC, abstractmethod
from typing import Tuple
from app.schemas.events import TransactionCreatedEvent

class FraudRule(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the rule"""
        pass
        
    @abstractmethod
    def evaluate(self, event: TransactionCreatedEvent) -> Tuple[int, bool]:
        """
        Evaluates the transaction event.
        Returns a tuple of (risk_score, triggered)
        """
        pass
