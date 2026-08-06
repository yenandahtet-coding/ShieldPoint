import { supabase } from "./supabase";
import type { UserProfile } from "@/types/payment";

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export const authService = {
  async register(identifier: string, pin: string, name: string): Promise<LoginResponse> {
    if (pin.length !== 6) throw new Error("PIN must be 6 digits");

    const email = `${identifier.replace(/\D/g, "")}@novapay.com`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    const { data: profileRes, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (profileErr) throw profileErr;

    return {
      token: data.session?.access_token || '',
      user: {
        id: profileRes.id,
        name: profileRes.name,
        phone: profileRes.phone,
        balance: Number(profileRes.balance),
        currency: 'MMK'
      }
    };
  },

  async login(identifier: string, pin: string): Promise<LoginResponse> {
    if (pin.length !== 6) throw new Error("PIN must be 6 digits");

    const email = `${identifier.replace(/\D/g, "")}@novapay.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (error) throw error;

    const { data: profileRes, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (profileErr) throw profileErr;

    return {
      token: data.session?.access_token || '',
      user: {
        id: profileRes.id,
        name: profileRes.name,
        phone: profileRes.phone,
        balance: Number(profileRes.balance),
        currency: 'MMK'
      }
    };
  },

  async getSession() {
    return await supabase.auth.getSession();
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};
