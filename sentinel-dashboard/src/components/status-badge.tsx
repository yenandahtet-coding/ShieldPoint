import { cn } from "@/lib/utils";
import type { TxStatus } from "@/lib/mock";

const styles: Record<TxStatus, string> = {
  Approved: "border-success/40 bg-success/12 text-success",
  Review: "border-warning/40 bg-warning/12 text-warning",
  Fraud: "border-danger/45 bg-danger/14 text-danger",
};

export function StatusBadge({ status, className }: { status: TxStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        styles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function RiskMeter({ score }: { score: number }) {
  const tone = score >= 75 ? "bg-danger" : score >= 45 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Critical: "border-danger/45 bg-danger/14 text-danger",
    High: "border-warning/45 bg-warning/14 text-warning",
    Medium: "border-cyan/45 bg-cyan/12 text-cyan",
    Low: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        map[severity] ?? map["Low"],
      )}
    >
      {severity}
    </span>
  );
}
