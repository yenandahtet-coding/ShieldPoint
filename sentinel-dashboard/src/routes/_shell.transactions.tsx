import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Play,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { loggerService, type TransactionRecord } from "@/services/loggerService";
import { RiskMeter, StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/skeletons";
import { TransactionDetailsModal } from "@/components/transaction-details-modal";
import { exportCsv, fmtMoney, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/transactions")({
  head: () => ({
    meta: [
      { title: "Live Transaction Monitor — NordVault" },
      {
        name: "description",
        content:
          "Real-time streaming table of authorised payments with masked accounts, risk scores and decision status.",
      },
      { property: "og:title", content: "Live Transaction Monitor — NordVault" },
      {
        property: "og:description",
        content: "Real-time streaming payment authorisations with live risk scoring.",
      },
    ],
  }),
  component: TransactionsPage,
});

type SortKey = "created_at" | "amount" | "riskScore";

function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(true);

  // Refetch every 3s if live is enabled
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["transactions", page],
    queryFn: () => loggerService.getTransactions(page, 20),
    refetchInterval: live ? 3000 : false
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | "All">("All");
  const [reviewed, setReviewed] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("reviewed_frauds") || "[]"); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("reviewed_frauds", JSON.stringify(reviewed));
  }, [reviewed]);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "created_at",
    dir: "desc",
  });
  const [selected, setSelected] = useState<TransactionRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = rows.filter(
      (t) =>
        (status === "All" || t.status === status) &&
        (!q ||
          [t.transaction_id, t.sender_id].some((f) =>
            f.toLowerCase().includes(q),
          )),
    );
    return out.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "created_at")
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      // We don't have riskScore in postgres logger yet, so fallback to amount for now
      return ((a as any)[sort.key] || 0 - (b as any)[sort.key] || 0) * dir;
    });
  }, [rows, query, status, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-input bg-surface-2/50 px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search ID, sender…"
              className="w-full bg-transparent py-2.5 text-sm outline-hidden placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex shrink-0 gap-1 rounded-xl border border-border bg-surface-2/50 p-1">
            {(["All", "ACCEPTED", "DECLINED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setLive((l) => !l)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
          >
            {live ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {live ? "Pause stream" : "Resume stream"}
          </button>

          <button
            onClick={() => {
              exportCsv(filtered, "transactions.csv");
              toast.success("Exported transactions.csv");
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={10} />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-5xl text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium">Receiver</th>
                  <th className="px-4 py-3 font-medium">
                    <SortBtn label="Amount" onClick={() => toggleSort("amount")} />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <SortBtn label="Time" onClick={() => toggleSort("created_at")} />
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((t) => (
                    <motion.tr
                      key={t.transaction_id}
                      layout
                      initial={{ opacity: 0, y: -12, backgroundColor: "rgba(56,189,248,0.14)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      onClick={() => setSelected(t)}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/50"
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.transaction_id.substring(0, 8)}...</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{t.sender_id.substring(0, 8)}...</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{t.receiver_phone || "N/A"}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                        {fmtMoney(t.amount, t.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {fmtTime(t.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status === "ACCEPTED" || t.status === "COMPLETED" ? "Approved" : "Fraud"} />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3">
          <p className="truncate text-xs text-muted-foreground">
            Showing page {page} ({rows.length} loaded)
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-border p-1.5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              Page {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={rows.length < 20}
              className="rounded-lg border border-border p-1.5 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <TransactionDetailsModal
        tx={selected as any}
        onClose={() => setSelected(null)}
        onMarkReviewed={(id) => {
          setReviewed((r) => [...r, id]);
          toast.success(`${id.substring(0, 8)} marked reviewed`);
        }}
        isReviewed={selected ? reviewed.includes((selected as any).fraud_id || selected.transaction_id || (selected as any).id) : false}
      />
    </div>
  );
}

function SortBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
      {label} <ArrowUpDown className="size-3" />
    </button>
  );
}
