from typing import List, Tuple
from app.rules.base import FraudRule
from app.rules.specific_rules import (
    LargeAmountRule,
    BlacklistedReceiverRule,
    OutsideBusinessHoursRule,
    HighFrequencyRule,
    RapidConsecutiveTransfersRule,
    ImpossibleTravelRule
)
from app.schemas.events import TransactionCreatedEvent

class RuleEngine:
    def __init__(self):
        # Register all rules using the Strategy Pattern
        self.rules: List[FraudRule] = [
            LargeAmountRule(),
            BlacklistedReceiverRule(),
            OutsideBusinessHoursRule(),
            HighFrequencyRule(),
            RapidConsecutiveTransfersRule(),
            ImpossibleTravelRule()
        ]

    def analyze(self, event: TransactionCreatedEvent) -> Tuple[int, str, List[str]]:
        """
        Evaluates the event against all registered rules.
        Returns (risk_score, risk_level, triggered_rules_list)
        """
        total_score = 0
        triggered_rules = []
        
        for rule in self.rules:
            score, triggered = rule.evaluate(event)
            if triggered:
                total_score += score
                triggered_rules.append(rule.name)
                
        # Cap the total score at 100
        total_score = min(total_score, 100)
        
        risk_level = "LOW"
        if 30 <= total_score <= 59:
            risk_level = "MEDIUM"
        elif total_score >= 60:
            risk_level = "HIGH"
            
        return total_score, risk_level, triggered_rules

rule_engine = RuleEngine()
