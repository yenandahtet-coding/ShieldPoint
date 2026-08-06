import { supabase } from "./supabase";
import axios from "axios";

/**
 * Phase 2 Integration
 * 
 * This client abstracts all transaction-related operations to point to the new
 * distributed FastAPI backend (api-service).
 */

const API_BASE_URL = "http://localhost:8000"; // Can be moved to .env in the future

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const transactionBackendClient = {
  async transfer(payload: { recipientPhone: string; amount: number; pin: string; note?: string }): Promise<{ id: string, receiver_id: string } | null> {
    // 1. Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !authUser.email) throw new Error("Not authenticated");

    // 2. Call our new Distributed API Service
    try {
      const response = await api.post("/transfer", {
        senderId: authUser.id,
        receiverPhone: payload.recipientPhone,
        amount: payload.amount,
        note: payload.note || 'Transfer',
        pin: payload.pin
      });

      // The API returns { transactionId, status, message }
      return { id: response.data.transactionId, receiver_id: "unknown_receiver" }; // The receiver_id might not be returned immediately depending on API mapping, so returning placeholder.
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || "Failed to process transfer");
    }
  },
  
  async transferMerchant(payload: { merchantPhone: string; amount: number; note?: string; pin: string }): Promise<{ id: string, receiver_id: string } | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !authUser.email) throw new Error("Not authenticated");

    try {
      const response = await api.post("/transfer", {
        senderId: authUser.id,
        merchantId: payload.merchantPhone,
        amount: payload.amount,
        note: payload.note || "Merchant QR payment",
        pin: payload.pin
      });

      return { id: response.data.transactionId, receiver_id: payload.merchantPhone };
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || "Failed to process merchant transfer");
    }
  },

  async deposit(payload: { amount: number; method: string }): Promise<{ success: boolean; timestamp: string }> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !authUser.email) throw new Error("Not authenticated");

    try {
      const response = await api.post("/deposit", {
        senderId: authUser.id,
        amount: payload.amount,
        note: `Deposit via ${payload.method}`,
        pin: "000000" // Deposits might not need a PIN in reality
      });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error: any) {
      throw new Error("Failed to process deposit");
    }
  },

  async withdraw(payload: { amount: number; method: string; pin?: string }): Promise<{ success: boolean; timestamp: string }> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !authUser.email) throw new Error("Not authenticated");

    try {
      const response = await api.post("/withdraw", {
        senderId: authUser.id,
        amount: payload.amount,
        note: `Withdrawal via ${payload.method}`,
        pin: payload.pin || "000000"
      });

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error: any) {
      throw new Error("Failed to process withdrawal");
    }
  }
};
