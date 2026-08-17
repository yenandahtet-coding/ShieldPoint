import axios from "axios";

export interface NotificationHistory {
  notificationId: string;
  eventId: string;
  transactionId: string;
  status: string;
  timestamp: string;
}

const client = axios.create({ baseURL: "http://127.0.0.1:8003" });

export const notificationService = {
  async getHistory(): Promise<NotificationHistory[]> {
    const { data } = await client.get<{ history: NotificationHistory[] }>("/history");
    return data.history;
  }
};
