class MetricsTracker:
    def __init__(self):
        self.events_received = 0
        self.events_saved = 0
        self.events_failed = 0
        self.duplicate_events = 0

metrics_tracker = MetricsTracker()
