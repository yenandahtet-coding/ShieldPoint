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
      get("http://127.0.0.1:8000/metrics"),
      get("http://127.0.0.1:8001/metrics"),
      get("http://127.0.0.1:8002/metrics"),
      get("http://127.0.0.1:8003/metrics")
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

const COUNTRY_MAP: Record<string, string> = {
  "MM": "Myanmar",
  "MMR": "Myanmar",
  "MYANMAR (BURMA)": "Myanmar",
  "SG": "Singapore",
  "SGP": "Singapore",
  "TH": "Thailand",
  "THA": "Thailand",
  "US": "United States",
  "USA": "United States",
  "UK": "United Kingdom",
  "GB": "United Kingdom",
  "MY": "Malaysia",
  "MYS": "Malaysia",
};

function normalizeCountry(country: string): string {
  if (!country) return "Unknown";
  const upper = country.trim().toUpperCase();
  if (COUNTRY_MAP[upper]) return COUNTRY_MAP[upper];
  return country.trim().charAt(0).toUpperCase() + country.trim().slice(1).toLowerCase();
}

function mergeCountryData(transactions: any[], frauds: any[]) {
  const map = new Map();

  transactions.forEach(t => {
    const c = normalizeCountry(t.country);
    if (map.has(c)) {
      map.get(c).transactions += (t.transactions || 0);
    } else {
      map.set(c, { country: c, transactions: t.transactions || 0, fraud: 0 });
    }
  });

  frauds.forEach(f => {
    const c = normalizeCountry(f.country);
    if (map.has(c)) {
      map.get(c).fraud += (f.fraud || 0);
    } else {
      map.set(c, { country: c, transactions: 0, fraud: f.fraud || 0 });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.transactions - a.transactions);
}
