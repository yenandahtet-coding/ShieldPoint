import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle2, Snowflake, X } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/mock";
import { RiskMeter, StatusBadge } from "@/components/status-badge";
import { fmtDateTime, fmtMoney } from "@/lib/format";

export function TransactionDetailsModal({
  tx,
  onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {tx && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="glass relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto scrollbar-thin rounded-t-3xl bg-surface/95 p-6 sm:rounded-3xl"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{tx.id}</p>
                <h2 className="truncate text-2xl font-bold">{tx.customer}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tx.merchant} · {tx.location}, {tx.country} · {fmtDateTime(tx.timestamp)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Section title="Customer information">
                <Row label="Account" value={tx.account} mono />
                <Row label="Segment" value="Retail · Premium" />
                <Row label="Tenure" value="6 years 2 months" />
                <Row label="Home country" value={tx.country} />
                <Row label="Device" value="iOS 18 · known fingerprint" />
              </Section>

              <Section title="Transaction">
                <Row label="Amount" value={fmtMoney(tx.amount, tx.currency)} />
                <Row label="Merchant category" value={tx.category} />
                <Row label="Channel" value="Card not present" />
                <Row label="Authorisation" value={tx.status === "Fraud" ? "Blocked" : "Captured"} />
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={tx.status} />
                </div>
              </Section>

              <Section title="Recent transaction history">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                    <span className="truncate text-muted-foreground">
                      {["Lumen Groceries", "MetroFuel Station", "Orbit Cloud", "AeroLink Airways"][i]}
                    </span>
                    <span className="shrink-0 font-mono text-xs">
                      {(120 * (i + 3)).toLocaleString()} {tx.currency}
                    </span>
                  </div>
                ))}
              </Section>

              <Section title="Risk analysis">
                <Row label="Model" value="gbm-fraud-v4.2" mono />
                <Row label="Baseline deviation" value={`${(tx.riskScore / 12).toFixed(1)}σ`} />
                <Row label="Geo velocity" value={tx.riskScore > 70 ? "Anomalous" : "Normal"} />
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <RiskMeter score={tx.riskScore} />
                </div>
              </Section>
            </div>

            <Section title="Triggered fraud rules" className="mt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {tx.rules.map((r) => (
                  <div
                    key={r.name}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                      r.triggered
                        ? "border-danger/40 bg-danger/10 text-danger"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {r.triggered ? (
                        <AlertTriangle className="size-3.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="size-3.5 shrink-0" />
                      )}
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs">+{r.triggered ? r.weight : 0}</span>
                  </div>
                ))}
              </div>
            </Section>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-surface-2/50 p-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Overall risk score
                </p>
                <p className="font-display text-3xl font-bold text-gradient">{tx.riskScore}/100</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  Decision:{" "}
                  <span className="font-semibold text-foreground">
                    {tx.status === "Fraud"
                      ? "Block & escalate to investigations"
                      : tx.status === "Review"
                        ? "Hold for manual review"
                        : "Auto-approve"}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  onClick={() => toast.success(`${tx.id} marked reviewed`)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
                >
                  Mark reviewed
                </button>
                <button
                  onClick={() => toast.warning(`Account ${tx.account} frozen`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-danger/15 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/25"
                >
                  <Snowflake className="size-3.5" /> Freeze account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface-2/40 p-4 ${className}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`truncate text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
