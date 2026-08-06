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
import { api } from "@/lib/api";
import type { Transaction, TxStatus } from "@/lib/mock";
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

const PAGE_SIZE = 12;
type SortKey = "timestamp" | "amount" | "riskScore";

function TransactionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["transactions"], queryFn: () => api.getTransactions(60) });
  const [rows, setRows] = useState<Transaction[]>([]);
  const [live, setLive] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TxStatus | "All">("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "timestamp",
    dir: "desc",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(async () => {
      const tx = await api.postTransaction();
      setFlash(tx.id);
      setRows((r) => [tx, ...r].slice(0, 200));
      if (tx.status === "Fraud") toast.error(`Fraud blocked · ${tx.customer} · ${tx.id}`);
    }, 3200);
    return () => clearInterval(id);
  }, [live]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = rows.filter(
      (t) =>
        (status === "All" || t.status === status) &&
        (!q ||
          [t.id, t.customer, t.merchant, t.location, t.country].some((f) =>
            f.toLowerCase().includes(q),
          )),
    );
    return out.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "timestamp")
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * dir;
      return (a[sort.key] - b[sort.key]) * dir;
    });
  }, [rows, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

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
              placeholder="Search ID, customer, merchant, country…"
              className="w-full bg-transparent py-2.5 text-sm outline-hidden placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex shrink-0 gap-1 rounded-xl border border-border bg-surface-2/50 p-1">
            {(["All", "Approved", "Review", "Fraud"] as const).map((s) => (
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
                  <th className="px-4 py-3 font-medium">Transaction</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">
                    <SortBtn label="Amount" onClick={() => toggleSort("amount")} />
                  </th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium">
                    <SortBtn label="Time" onClick={() => toggleSort("timestamp")} />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <SortBtn label="Risk" onClick={() => toggleSort("riskScore")} />
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {slice.map((t) => (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -12, backgroundColor: "rgba(56,189,248,0.14)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      onClick={() => setSelected(t)}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/50",
                        flash === t.id && "font-medium",
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{t.customer}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{t.account}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                        {fmtMoney(t.amount, t.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {t.location}, {t.country}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.merchant}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {fmtTime(t.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <RiskMeter score={t.riskScore} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
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
            Showing {slice.length} of {filtered.length} transactions
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="rounded-lg border border-border p-1.5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {current} / {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={current === pages}
              className="rounded-lg border border-border p-1.5 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <TransactionDetailsModal tx={selected} onClose={() => setSelected(null)} />
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
