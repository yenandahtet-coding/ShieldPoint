import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, History, QrCode, Send, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { WalletPage } from "@/components/wallet-ui";
import { TransactionItem } from "@/components/TransactionItem";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wallet Dashboard — Nova Pay" },
      {
        name: "description",
        content:
          "View your Nova Pay balance in USD or MMK, send money, scan QR codes and review recent activity.",
      },
      { property: "og:title", content: "Wallet Dashboard — Nova Pay" },
      {
        property: "og:description",
        content: "Your balance, quick actions and recent transactions in one glassy dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const ACTIONS = [
  { to: "/pay/phone", label: "Send", icon: Send },
  { to: "/pay/qr", label: "Scan", icon: QrCode },
  { to: "/pay/qr", label: "Receive", icon: Wallet },
  { to: "/history", label: "History", icon: History },
] as const;

function Dashboard() {
  const { user, transactions, format, setCurrency } = useWallet();
  const [hidden, setHidden] = useState(false);

  const spent = transactions
    .filter((t) => t.senderId === user.id)
    .reduce((s, t) => s + t.amount, 0);
  const received = transactions
    .filter((t) => t.receiverId === user.id)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <WalletPage>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Good to see you
          </p>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
        </div>
        <Link to="/profile" className="gradient-brand grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-background transition-transform hover:scale-105 active:scale-95">
          {user.name.charAt(0)}
        </Link>
      </header>

      <section className="glass glow-brand relative mt-6 overflow-hidden rounded-3xl p-6">
        <div className="gradient-brand pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl" />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total available balance
            </p>
            <div className="mt-2 flex items-center gap-3">
              <p className="num min-w-0 text-[clamp(1.5rem,7.5vw,3rem)] leading-none font-semibold tracking-tighter whitespace-nowrap">
                {hidden ? "••••••" : format(user.balance)}
              </p>
              <button
                onClick={() => setHidden((h) => !h)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Toggle balance visibility"
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/80">
              Wallet ID: <span className="font-mono tracking-wider">{user.phone}</span>
            </p>
          </div>


        </div>

        <div className="mt-7 grid grid-cols-4 gap-2 sm:gap-3">
          {ACTIONS.map(({ to, label, icon: Icon }) => (
            <motion.div key={label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
              <Link
                to={to}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-secondary/40 px-2 py-3 text-[11px] font-medium transition-colors hover:border-primary/50 sm:text-xs"
              >
                <Icon className="h-4 w-4 text-cyan-accent" />
                {label}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Sent</p>
          <p className="num mt-1 truncate text-lg font-semibold">{format(spent)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-success" /> Received
          </p>
          <p className="num mt-1 truncate text-lg font-semibold text-success">
            {format(received)}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <Link to="/history" className="shrink-0 text-xs text-cyan-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-2.5">
          {transactions.slice(0, 5).map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))}
        </div>
      </section>
    </WalletPage>
  );
}
