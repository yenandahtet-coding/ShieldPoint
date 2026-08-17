import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Snowflake, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fraudService } from "@/services/fraudService";
import { adminService } from "@/services/adminService";
import { RiskMeter, StatusBadge } from "@/components/status-badge";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TransactionDetailsModal({
  tx,
  onClose,
  onMarkReviewed,
  isReviewed,
}: {
  tx: any | null;
  onClose: () => void;
  onMarkReviewed?: (id: string) => void;
  isReviewed?: boolean;
}) {
  if (!tx) return null;

  const id = tx.fraud_id || tx.transaction_id || tx.id;
  const rawCustomer = tx.sender_id || tx.customer;
  const customerId = rawCustomer || "Unknown";
  const customerName = rawCustomer ? rawCustomer.substring(0, 8) + "..." : "Unknown";

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

  const toggleFreeze = () => {
    if (customerId === "Unknown") return;
    freezeMutation.mutate();
  };

  const isFraudStatus = tx.status && tx.status !== "ACCEPTED" && tx.status !== "COMPLETED";
  const { data: fraudData } = useQuery({
    queryKey: ["fraud", id],
    queryFn: () => fraudService.getFraud(id),
    enabled: !!id && tx.risk_score === undefined && (isFraudStatus || tx.status === "Fraud"),
    retry: false
  });

  const isFraud = tx.risk_score !== undefined || fraudData !== undefined || isFraudStatus;
  const status = isFraud ? "Fraud" : "Approved";
  const time = tx.timestamp || tx.created_at;
  const risk = tx.risk_score || fraudData?.risk_score || tx.riskScore || (isFraud ? 85 : 12);
  const amount = tx.amount || 0;
  const currency = tx.currency || "USD";
  const rules = tx.triggered_rules || fraudData?.triggered_rules || [];
  const riskLevel = tx.risk_level || fraudData?.risk_level || "Unknown";

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
                  <h2 className="truncate text-xl font-bold flex items-center gap-2">
                    {customerName}
                    {isFrozen && <span className="text-xs bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full font-medium">Frozen</span>}
                  </h2>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1">
                    Fraud ID: {tx.fraud_id || id}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Trans ID: {tx.transaction_id || tx.id}
                  </p>
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
                {isFraud && <Row label="Risk Level" value={riskLevel} />}
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
                  onClick={() => {
                    if (onMarkReviewed && id) onMarkReviewed(id);
                    else toast.success(`${id.substring(0, 8)} marked reviewed`);
                  }}
                  disabled={isReviewed}
                  className={cn(
                    "rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent",
                    isReviewed ? "opacity-50 cursor-not-allowed bg-accent" : ""
                  )}
                >
                  {isReviewed ? "Reviewed" : "Mark reviewed"}
                </button>
                <button
                  onClick={toggleFreeze}
                  disabled={freezeMutation.isPending || isStatusLoading || customerId === "Unknown"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50",
                    isFrozen
                      ? "bg-success/15 text-success hover:bg-success/25"
                      : "bg-danger/15 text-danger hover:bg-danger/25"
                  )}
                >
                  {freezeMutation.isPending || isStatusLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Snowflake className="size-3.5" />}
                  {isFrozen ? "Unfreeze account" : "Freeze account"}
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
