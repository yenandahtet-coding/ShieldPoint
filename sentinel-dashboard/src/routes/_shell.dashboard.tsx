import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Activity,
  Database,
  Gauge,
  Layers,
  Radio,
  ShieldCheck,
  ShieldX,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { metricsService } from "@/services/metricsService";
import { healthService } from "@/services/healthService";
import { AnimatedCounter } from "@/components/animated-counter";
import { CardSkeleton } from "@/components/skeletons";
import { chartTooltip } from "@/components/chart-theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — NordVault Fraud Detection" },
      {
        name: "description",
        content:
          "Live KPIs for transaction volume, detected fraud, risk scoring and pipeline service health.",
      },
      { property: "og:title", content: "Operations Dashboard — NordVault" },
      {
        property: "og:description",
        content: "Live KPIs for transaction volume, fraud detection and pipeline health.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: metricsService.getMetrics,
    refetchInterval: 8000,
  });
  
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ["dashboard-health"],
    queryFn: healthService.getHealth,
    refetchInterval: 10000,
  });

  if (isMetricsLoading || isHealthLoading || !metrics || !health) return <CardSkeleton count={8} />;

  const legitimateCount = Math.max(0, metrics.transactionsProcessed - metrics.fraudDetected);
  const avgRisk = metrics.fraudDetected > 0 ? (metrics.highRisk * 85 + metrics.mediumRisk * 55) / metrics.fraudDetected : 12;

  const kpis = [
    {
      label: "Total transactions today",
      value: metrics.transactionsProcessed,
      icon: Activity,
      tone: "text-primary",
      sub: "Processed by Logger",
    },
    {
      label: "Fraud detected",
      value: metrics.fraudDetected,
      icon: ShieldX,
      tone: "text-danger",
      sub: "Blocked before settlement",
    },
    {
      label: "Legitimate transactions",
      value: legitimateCount,
      icon: ShieldCheck,
      tone: "text-success",
      sub: "Auto-approved by policy",
    },
    {
      label: "Average risk score",
      value: avgRisk,
      decimals: 1,
      icon: Gauge,
      tone: "text-warning",
      sub: "Rolling 24h window",
    },
    {
      label: "Active consumers",
      value: metrics.activeConsumers,
      icon: Users,
      tone: "text-cyan",
      sub: "Kafka consumer group",
    },
  ];

  const services = [
    {
      label: "Fraud Service",
      status: health.fraud.status,
      detail: `MongoDB: ${health.fraud.mongodb || "N/A"}`,
      icon: Layers,
    },
    {
      label: "API Gateway",
      status: health.api.status,
      detail: `FastAPI Proxy`,
      icon: Radio,
    },
    {
      label: "Logger Service",
      status: health.logger.status,
      detail: `PostgreSQL: ${health.logger.postgresql || "N/A"}`,
      icon: Database,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="glass glass-hover rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
              <k.icon className={`size-4 shrink-0 ${k.tone}`} />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">
              <AnimatedCounter value={k.value} decimals={k.decimals ?? 0} />
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {services.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
            className="glass rounded-2xl p-5"
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2">
                <s.icon className="size-4 text-cyan" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.label}</p>
                <p className="truncate text-xs text-muted-foreground">{s.detail}</p>
              </div>
              <span className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                s.status === "UP" ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"
              )}>
                <span className={cn(
                  "size-1.5 rounded-full",
                  s.status === "UP" ? "bg-success" : "bg-danger"
                )} />
                {s.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
