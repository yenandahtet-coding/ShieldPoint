import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Eye, MapPin, Search, Snowflake, CheckCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/mock";
import { RiskMeter, StatusBadge } from "@/components/status-badge";
import { CardSkeleton } from "@/components/skeletons";
import { TransactionDetailsModal } from "@/components/transaction-details-modal";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_shell/frauds")({
  head: () => ({
    meta: [
      { title: "Fraud Detection Panel — NordVault" },
      {
        name: "description",
        content:
          "Queue of suspicious transactions with trigger reasons, risk scores and analyst actions.",
      },
      { property: "og:title", content: "Fraud Detection Panel — NordVault" },
      {
        property: "og:description",
        content: "Review suspicious transactions, freeze accounts and clear false positives.",
      },
    ],
  }),
  component: FraudsPage,
});

function FraudsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["frauds"], queryFn: api.getFrauds });
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (t) => !q || [t.customer, t.country, t.reason].some((f) => f.toLowerCase().includes(q)),
    );
  }, [data, query]);

  if (isLoading) return <CardSkeleton count={6} />;

  return (
    <div className="space-y-4">
      <div className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-input bg-surface-2/50 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by customer, country or trigger reason…"
            className="w-full bg-transparent py-2.5 text-sm outline-hidden placeholder:text-muted-foreground"
          />
        </div>
        <span className="shrink-0 rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
          {list.length} open cases
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        <AnimatePresence initial={false}>
          {list.map((t, i) => (
            <motion.article
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35 }}
              className="glass glass-hover flex flex-col rounded-2xl p-5"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-muted-foreground">{t.id}</p>
                  <h3 className="truncate text-base font-semibold">{t.customer}</h3>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <p className="mt-3 font-display text-2xl font-bold">{fmtMoney(t.amount, t.currency)}</p>

              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" /> {t.location}, {t.country}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" /> {fmtDateTime(t.timestamp)}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-warning/30 bg-warning/8 px-3 py-2 text-xs text-warning">
                {t.reason}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Risk</span>
                <RiskMeter score={t.riskScore} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelected(t)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
                >
                  <Eye className="size-3.5" /> View details
                </button>
                <button
                  onClick={() => {
                    setReviewed((r) => [...r, t.id]);
                    toast.success(`${t.id} marked reviewed`);
                  }}
                  disabled={reviewed.includes(t.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-success/15 px-3 py-2 text-xs font-semibold text-success hover:bg-success/25 disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  {reviewed.includes(t.id) ? "Reviewed" : "Mark reviewed"}
                </button>
                <button
                  onClick={() => toast.warning(`Account ${t.account} frozen for ${t.customer}`)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-danger/15 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/25"
                >
                  <Snowflake className="size-3.5" /> Freeze
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      <TransactionDetailsModal tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
