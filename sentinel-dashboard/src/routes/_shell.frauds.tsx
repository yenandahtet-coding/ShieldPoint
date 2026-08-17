import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useEffect } from "react";
import { Eye, MapPin, Search, Snowflake, CheckCheck, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fraudService, type FraudRecord } from "@/services/fraudService";
import { adminService } from "@/services/adminService";
import { RiskMeter, StatusBadge } from "@/components/status-badge";
import { CardSkeleton } from "@/components/skeletons";
import { TransactionDetailsModal } from "@/components/transaction-details-modal";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["frauds", page],
    queryFn: () => fraudService.getFrauds(page, 20),
    refetchInterval: 5000
  });
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("reviewed_frauds") || "[]"); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("reviewed_frauds", JSON.stringify(reviewed));
  }, [reviewed]);
  const [selected, setSelected] = useState<FraudRecord | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const safeData = Array.isArray(data) ? data : [];
    return safeData.filter(
      (t) => !q || [t.sender_id, t.risk_level, t.transaction_id].some((f) => f?.toLowerCase().includes(q)),
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
            placeholder="Filter by sender or ID…"
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
              key={t.fraud_id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35 }}
              className="glass glass-hover flex flex-col rounded-2xl p-5"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-muted-foreground">{t.transaction_id.substring(0, 12)}...</p>
                  <h3 className="truncate font-mono text-base font-semibold">{t.sender_id.substring(0, 8)}...</h3>
                </div>
                <StatusBadge status={"Fraud"} />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" /> {fmtDateTime(t.timestamp)}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" /> Correlation: {t.correlation_id.substring(0, 8)}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-warning/30 bg-warning/8 px-3 py-2 text-xs text-warning">
                Triggered Rules: {t.triggered_rules.join(", ")}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Risk Score</span>
                <RiskMeter score={t.risk_score} />
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
                    setReviewed((r) => [...r, t.fraud_id]);
                    toast.success(`${t.fraud_id.substring(0, 8)} marked reviewed`);
                  }}
                  disabled={reviewed.includes(t.fraud_id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-success/15 px-3 py-2 text-xs font-semibold text-success hover:bg-success/25 disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  {reviewed.includes(t.fraud_id) ? "Reviewed" : "Mark reviewed"}
                </button>
                <FreezeButton customerId={t.sender_id} />
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-xl border border-border bg-surface-2/50 px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          Page {page}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={list.length < 20}
          className="rounded-xl border border-border bg-surface-2/50 px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <TransactionDetailsModal
        tx={selected as any}
        onClose={() => setSelected(null)}
        onMarkReviewed={(id) => {
          setReviewed((r) => [...r, id]);
          toast.success(`${id.substring(0, 8)} marked reviewed`);
        }}
        isReviewed={selected ? reviewed.includes(selected.fraud_id || selected.transaction_id) : false}
      />
    </div>
  );
}

function FreezeButton({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ["profile-status", customerId],
    queryFn: () => adminService.getAccountStatus(customerId),
    enabled: !!customerId && customerId !== "Unknown",
    retry: false
  });

  const isFrozen = statusData?.status === "FROZEN";

  const freezeMutation = useMutation({
    mutationFn: () => isFrozen ? adminService.unfreezeAccount(customerId) : adminService.freezeAccount(customerId),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile-status", customerId], data);
      if (data.status === "FROZEN") {
        toast.warning(`Account frozen`);
      } else {
        toast.success(`Account unfrozen`);
      }
    },
    onError: () => {
      toast.error(`Failed to change account status`);
    }
  });

  return (
    <button
      onClick={() => freezeMutation.mutate()}
      disabled={freezeMutation.isPending || isStatusLoading || !customerId || customerId === "Unknown"}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50",
        isFrozen
          ? "bg-success/15 text-success hover:bg-success/25"
          : "bg-danger/15 text-danger hover:bg-danger/25"
      )}
    >
      {freezeMutation.isPending || isStatusLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Snowflake className="size-3.5" />}
      {isFrozen ? "Unfreeze" : "Freeze"}
    </button>
  );
}
