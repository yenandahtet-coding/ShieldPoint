import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Receipt, X } from "lucide-react";
import { useMemo, useState } from "react";
import { WalletPage, StatusBadge } from "@/components/wallet-ui";
import { TransactionItem } from "@/components/TransactionItem";
import { useWallet } from "@/context/WalletContext";
import type { Transaction } from "@/types/payment";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Transaction History — Nova Pay" },
      {
        name: "description",
        content: "Filter every Nova Pay debit, credit, pending and flagged transaction receipt.",
      },
      { property: "og:title", content: "Transaction History — Nova Pay" },
      {
        property: "og:description",
        content: "A filterable feed of your wallet activity with full receipt details.",
      },
    ],
  }),
  component: HistoryPage,
});

const FILTERS = ["All", "Outgoing", "Incoming", "Flagged"] as const;
type Filter = (typeof FILTERS)[number];

function HistoryPage() {
  const { user, transactions, format } = useWallet();
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const list = useMemo(
    () =>
      transactions.filter((t) => {
        if (filter === "Outgoing") return t.senderId === user.id;
        if (filter === "Incoming") return t.receiverId === user.id;
        if (filter === "Flagged") return t.status === "FLAGGED" || t.status === "PENDING";
        return true;
      }),
    [transactions, filter, user.id],
  );

  return (
    <WalletPage>
      <h1 className="text-xl font-semibold tracking-tight">Transaction history</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        {list.length} of {transactions.length} records
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`relative rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "border-transparent text-background"
                : "border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter === f && (
              <motion.span
                layoutId="history-filter"
                className="gradient-brand absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{f}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {list.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
        ))}
        {list.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No transactions in this filter yet.
          </p>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-sm sm:place-items-center"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <Receipt className="h-4 w-4 text-cyan-accent" /> Receipt
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p
                className={`num mt-6 text-center text-4xl font-semibold ${
                  selected.receiverId === user.id ? "text-success" : "text-foreground"
                }`}
              >
                {selected.receiverId === user.id ? "+" : "−"}
                {format(selected.amount)}
              </p>
              <div className="mt-3 flex justify-center">
                <StatusBadge status={selected.status} />
              </div>

              <dl className="mt-7 space-y-3 text-sm">
                {[
                  ["Transaction ID", selected.id],
                  ["Counterparty", selected.receiverName],
                  ["Receiver phone", selected.receiverPhone],
                  ["Sender phone", selected.senderPhone],
                  ["Payment type", selected.type],
                  ["Timestamp", new Date(selected.timestamp).toLocaleString()],
                  ["Note", selected.note ?? "—"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/50 pb-2"
                  >
                    <dt className="truncate text-muted-foreground">{k}</dt>
                    <dd className="num truncate text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WalletPage>
  );
}