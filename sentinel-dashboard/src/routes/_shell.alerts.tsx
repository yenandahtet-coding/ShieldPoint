import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Bell, Check, Filter } from "lucide-react";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";
import { SeverityBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/skeletons";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Center — NordVault" },
      {
        name: "description",
        content:
          "Notification center for high risk transactions, impossible travel, large withdrawals and failed attempts.",
      },
      { property: "og:title", content: "Alert Center — NordVault" },
      {
        property: "og:description",
        content: "Severity-ranked fraud alerts with acknowledgement workflow.",
      },
    ],
  }),
  component: AlertsPage,
});

const FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;

function AlertsPage() {
  const { data, isLoading } = useQuery({ 
    queryKey: ["alerts"], 
    queryFn: () => notificationService.getHistory(),
    refetchInterval: 5000
  });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [acked, setAcked] = useState<string[]>([]);

  // Map real notification history to alert format for UI
  const alerts = useMemo(() => {
    return (data ?? []).map((n) => ({
      id: n.notificationId,
      type: "Fraud Alert Dispatch",
      message: `Notification dispatched for transaction: ${n.transactionId}`,
      severity: "High" as const,
      time: n.timestamp,
      status: n.status
    }));
  }, [data]);

  const list = useMemo(
    () => alerts.filter((a) => filter === "All" || a.severity === filter),
    [alerts, filter],
  );

  return (
    <div className="space-y-4">
      <div className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4">
        <div className="flex min-w-0 items-center gap-2">
          <Filter className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Bell className="size-3.5" /> {list.length} alerts
        </span>
      </div>

      {isLoading ? (
        <div className="glass rounded-2xl p-4">
          <TableSkeleton rows={8} />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {list.map((a, i) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                className="glass glass-hover grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl p-4"
              >
                <div
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    a.severity === "Critical"
                      ? "bg-danger/15 text-danger"
                      : a.severity === "High"
                        ? "bg-warning/15 text-warning"
                        : "bg-cyan/15 text-cyan",
                  )}
                >
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{a.type}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.message}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {a.id.substring(0,8)}... · {fmtDateTime(a.time)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <SeverityBadge severity={a.severity} />
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {acked.includes(a.id) ? "Acknowledged" : a.status}
                  </span>
                  <button
                    onClick={() => {
                      setAcked((s) => [...s, a.id]);
                      toast.success(`Alert acknowledged`);
                    }}
                    disabled={acked.includes(a.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                    aria-label="Acknowledge alert"
                  >
                    <Check className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
