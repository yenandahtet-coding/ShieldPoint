import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { walletService } from "@/services/walletService";
import { setAuthToken } from "@/services/axios";
import { authService } from "@/services/authService";
import type { Transaction, UserProfile } from "@/types/payment";
import { useEffect } from "react";

const MMK_RATE = 2100;

interface WalletState {
  token: string | null;
  user: UserProfile;
  transactions: Transaction[];
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  setCurrency: (c: UserProfile["currency"]) => void;
  applyTransaction: (tx: Transaction) => void;
  format: (amount: number) => string;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>({ id: '', name: '', phone: '', balance: 0, currency: 'MMK' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Restore session from Supabase on mount
  useEffect(() => {
    authService.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        walletService.getProfile()
          .then((profile) => {
            setAuthToken(session.access_token);
            setToken(session.access_token);
            setUser(profile);
          })
          .catch(console.error);
      }
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthToken(null);
        setToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (token) {
      walletService.getTransactions().then(setTransactions).catch(console.error);
    } else {
      setTransactions([]);
      setUser({ id: '', name: '', phone: '', balance: 0, currency: 'MMK' });
    }
  }, [token]);

  const login = useCallback((t: string, u: UserProfile) => {
    setAuthToken(t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authService.signOut().catch(console.error);
    setAuthToken(null);
    setToken(null);
  }, []);

  const setCurrency = useCallback(
    (currency: UserProfile["currency"]) => setUser((u) => ({ ...u, currency })),
    [],
  );

  const applyTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
    setUser((u) =>
      tx.senderId === u.id ? { ...u, balance: +(u.balance - tx.amount).toFixed(2) } : u,
    );
  }, []);

  const format = useCallback(
    (amount: number) => {
      return `${Math.round(amount).toLocaleString("en-US")} Ks`;
    },
    [],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      transactions,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setCurrency,
      applyTransaction,
      format,
    }),
    [token, user, transactions, login, logout, setCurrency, applyTransaction, format],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}