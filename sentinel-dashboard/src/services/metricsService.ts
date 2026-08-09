import axios from "axios";

const get = async (url: string) => {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    return data;
  } catch {
    return {};
  }
};

export const metricsService = {
  async getMetrics() {
    const data = await get("http://127.0.0.1:8000/dashboard/summary");

    return {
      transactionsProcessed: data.totalTransactions || 0,
      fraudDetected: data.fraudDetected || 0,
      highRisk: Math.floor((data.fraudDetected || 0) * 0.4),
      mediumRisk: Math.floor((data.fraudDetected || 0) * 0.6),
      notificationsSent: data.totalTransactions || 0,
      activeConsumers: data.activeConsumers || 3,

      perMinute: [],
      fraudTrend: [],
      riskDistribution: [],
      hourly: [],
      categories: [],
      byCountry: []
    };
  }
};
