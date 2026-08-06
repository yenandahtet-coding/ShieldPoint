class MetricsTracker:
    def __init__(self):
        self.events_received = 0
        self.fraud_detected = 0
        self.low_risk = 0
        self.medium_risk = 0
        self.high_risk = 0

metrics_tracker = MetricsTracker()
