import { supabase } from "./supabase";
import type { Transaction, UserProfile } from "@/types/payment";

export const walletService = {
  async getProfile(): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      balance: Number(data.balance),
      currency: data.currency,
    };
  },

  async getTransactions(): Promise<Transaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_phone.eq.${user.phone}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((t: any) => ({
      id: t.id || t.transaction_id,
      senderId: t.sender_id,
      senderPhone: t.sender_id === user.id ? user.phone : "Unknown",
      senderName: t.sender_id === user.id ? "Me" : "Unknown Sender",
      receiverId: t.receiver_phone,
      receiverPhone: t.receiver_phone,
      receiverName: t.receiver_phone || "Unknown User",
      amount: Number(t.amount),
      currency: t.currency,
      type: t.type,
      status: t.status,
      timestamp: t.created_at,
      note: t.note,
    }));
  },

  async getContacts() {
    const { data, error } = await supabase.from('profiles').select('name, phone').limit(50);
    if (error) return []; // Fallback
    return data.map((d: any) => ({ ...d, avatar: "https://i.pravatar.cc/150?u=" + d.phone, category: "Recent" }));
  },

  async lookupUserByPhone(phone: string): Promise<{ id: string, name: string } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('phone', phone)
      .maybeSingle();

    if (error) return null;
    return data;
  },
};
