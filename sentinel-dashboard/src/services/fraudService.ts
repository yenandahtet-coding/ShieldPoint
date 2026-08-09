import axios from "axios";

export interface FraudRecord {
  fraud_id: string;
  transaction_id: string;
  sender_id: string;
  risk_score: number;
  risk_level: string;
  triggered_rules: string[];
  timestamp: string;
  correlation_id: string;
}

const client = axios.create({ baseURL: "http://127.0.0.1:8002" });

export const fraudService = {
  async getFrauds(page = 1, limit = 20): Promise<FraudRecord[]> {
    const { data } = await client.get<FraudRecord[]>("/frauds", {
      params: { page, limit }
    });
    return data;
  },

  async getFraud(transactionId: string): Promise<FraudRecord> {
    const { data } = await client.get<FraudRecord>(`/frauds/${transactionId}`);
    return data;
  }
};
