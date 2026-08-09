import axios from "axios";

export interface TransactionRecord {
  transaction_id: string;
  sender_id: string;
  receiver_phone: string | null;
  amount: number;
  currency: string;
  note: string | null;
  status: string;
  processing_status: string;
  event_id: string;
  correlation_id: string;
  created_at: string;
}

const client = axios.create({ baseURL: "http://localhost:8001" });

export const loggerService = {
  async getTransactions(page = 1, limit = 50): Promise<TransactionRecord[]> {
    const { data } = await client.get<TransactionRecord[]>("/transactions", {
      params: { page, limit }
    });
    return data;
  },
  
  async getTransaction(id: string): Promise<TransactionRecord> {
    const { data } = await client.get<TransactionRecord>(`/transactions/${id}`);
    return data;
  }
};
