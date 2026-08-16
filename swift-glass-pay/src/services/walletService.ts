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

    // Fetch user's phone to check received transactions by phone
    const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
    const userPhone = profile?.phone || 'NO_PHONE';

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        sender:profiles!sender_id(name, phone)
      `)
      .or(`sender_id.eq.${user.id},receiver_phone.eq.${userPhone}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Collect unique receiver phones that are not the current user
    const receiverPhones = [...new Set(data.map(t => t.receiver_phone).filter(p => p && p !== userPhone))];
    
    // Fetch profiles for these phones
    const { data: receiverProfiles } = await supabase
      .from('profiles')
      .select('name, phone')
      .in('phone', receiverPhones);
      
    // Create a lookup map for receiver names
    const phoneToName = Object.fromEntries(
      (receiverProfiles || []).map(p => [p.phone, p.name])
    );

    return data.map((t: any) => ({
      id: t.transaction_id || t.id,
      senderId: t.sender_id,
      senderPhone: t.sender?.phone,
      senderName: t.sender?.name || "Wallet User",
      receiverId: t.receiver_phone,
      receiverPhone: t.receiver_phone,
      receiverName: t.receiver_phone === userPhone ? "Me" : (phoneToName[t.receiver_phone] || t.receiver_phone || "Wallet User"),
      amount: Number(t.amount),
      currency: t.currency,
      type: t.sender_id === user.id ? "TRANSFER" : "RECEIVED",
      status: t.status,
      timestamp: t.created_at ? (t.created_at.endsWith('Z') ? t.created_at : `${t.created_at}Z`) : new Date().toISOString(),
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
