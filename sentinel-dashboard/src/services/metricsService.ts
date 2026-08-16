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
      byCountry: mergeCountryData(loggerMetrics.by_country || [], fraudMetrics.by_country || [])
    };
  }
};

function mergeCountryData(transactions: any[], frauds: any[]) {
  const map = new Map();
  transactions.forEach(t => {
    map.set(t.country, { country: t.country, transactions: t.transactions, fraud: 0 });
  });
  frauds.forEach(f => {
    if (map.has(f.country)) {
      map.get(f.country).fraud = f.fraud;
    } else {
      map.set(f.country, { country: f.country, transactions: 0, fraud: f.fraud });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.transactions - a.transactions);
}
