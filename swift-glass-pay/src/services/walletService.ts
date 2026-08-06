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
      .select(`
        *,
        sender:profiles!sender_id(name, phone),
        receiver:profiles!receiver_id(name, phone)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((t: any) => ({
      id: t.id,
      senderId: t.sender_id,
      senderPhone: t.sender?.phone,
      senderName: t.sender?.name || "Wallet User",
      receiverId: t.receiver_id,
      receiverPhone: t.receiver?.phone,
      receiverName: t.receiver?.name || "Wallet User",
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
