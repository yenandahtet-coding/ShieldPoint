import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Snowflake, X } from "lucide-react";
import { toast } from "sonner";
import { RiskMeter, StatusBadge } from "@/components/status-badge";
import { fmtDateTime, fmtMoney } from "@/lib/format";

export function TransactionDetailsModal({
  tx,
  onClose,
}: {
  tx: any | null;
  onClose: () => void;
}) {
  if (!tx) return null;
  
  const isFraud = tx.risk_score !== undefined;
  const id = tx.transaction_id || tx.id;
  const rawCustomer = tx.sender_id || tx.customer;
  const customer = rawCustomer ? rawCustomer.substring(0, 8) + "..." : "Unknown";
  const status = isFraud ? "Fraud" : (tx.status === "ACCEPTED" ? "Approved" : "Fraud");
  const time = tx.timestamp || tx.created_at;
  const risk = tx.risk_score || tx.riskScore || 12;
  const amount = tx.amount || 0;
  const currency = tx.currency || "USD";
  const rules = tx.triggered_rules || [];

  return (
    <AnimatePresence>
      {tx && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 bg-surface-2/30 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold">{customer}</h2>
                  <p className="font-mono text-[11px] text-muted-foreground">{id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 p-5">
              <Section title="Transaction">
                {amount > 0 && <Row label="Amount" value={fmtMoney(amount, currency)} />}
                {tx.receiver_phone && <Row label="Receiver" value={tx.receiver_phone} />}
                {tx.correlation_id && <Row label="Correlation ID" value={tx.correlation_id} mono />}
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={status} />
                </div>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Time</span>
                  <span className="text-sm font-medium">{fmtDateTime(time)}</span>
                </div>
              </Section>

              <Section title="Risk analysis">
                <Row label="Model" value="gbm-fraud-v4.2" mono />
                {isFraud && <Row label="Risk Level" value={tx.risk_level} />}
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <RiskMeter score={risk} />
                </div>
              </Section>
            </div>

            {rules.length > 0 && (
              <Section title="Triggered fraud rules" className="mx-5 mb-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  {rules.map((r: string) => (
                    <div
                      key={r}
                      className="flex items-center justify-between gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span className="truncate">{r}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="m-5 mt-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-surface-2/50 p-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Overall risk score
                </p>
                <p className="font-display text-3xl font-bold text-gradient">{risk}/100</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  onClick={() => toast.success(`${id.substring(0,8)} marked reviewed`)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
                >
                  Mark reviewed
                </button>
                <button
                  onClick={() => toast.warning(`Account frozen`)}
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
