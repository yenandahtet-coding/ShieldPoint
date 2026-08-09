import axios from "axios";

const get = async (url: string) => {
  try {
    const { data } = await axios.get(url, { timeout: 2000 });
    return data;
  } catch {
    return {};
  }
};

export const metricsService = {
  async getMetrics() {
    const [apiMetrics, loggerMetrics, fraudMetrics, notificationMetrics] = await Promise.all([
      get("http://localhost:8000/metrics"),
      get("http://localhost:8001/metrics"),
      get("http://localhost:8002/metrics"),
      get("http://localhost:8003/metrics")
    ]);
    
    return {
      transactionsProcessed: loggerMetrics.total_transactions || 0,
      fraudDetected: fraudMetrics.fraud_detected || 0,
      highRisk: fraudMetrics.high_risk || 0,
      mediumRisk: fraudMetrics.medium_risk || 0,
      notificationsSent: notificationMetrics.notifications_sent || 0,
      activeConsumers: 3,
      
      perMinute: loggerMetrics.per_minute || [],
      fraudTrend: fraudMetrics.fraud_trend || [],
      riskDistribution: fraudMetrics.risk_distribution || [],
      hourly: loggerMetrics.hourly || [],
      categories: [],
      byCountry: []
    };
  }
};
