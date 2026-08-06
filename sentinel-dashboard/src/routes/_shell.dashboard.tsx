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
import { api } from "@/lib/api";
import { AnimatedCounter } from "@/components/animated-counter";
import { CardSkeleton } from "@/components/skeletons";
import { chartTooltip } from "@/components/chart-theme";

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
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    refetchInterval: 8000,
  });
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: api.getAnalytics });

  if (isLoading || !data) return <CardSkeleton count={8} />;

  const kpis = [
    {
      label: "Total transactions today",
      value: data.totalTransactions,
      icon: Activity,
      tone: "text-primary",
      sub: "+4.8% vs yesterday",
    },
    {
      label: "Fraud detected",
      value: data.fraudDetected,
      icon: ShieldX,
      tone: "text-danger",
      sub: "Blocked before settlement",
    },
    {
      label: "Legitimate transactions",
      value: data.legitimate,
      icon: ShieldCheck,
      tone: "text-success",
      sub: "Auto-approved by policy",
    },
    {
      label: "Average risk score",
      value: data.avgRiskScore,
      decimals: 1,
      icon: Gauge,
      tone: "text-warning",
      sub: "Rolling 24h window",
    },
    {
      label: "Active consumers",
      value: data.activeConsumers,
      icon: Users,
      tone: "text-cyan",
      sub: "Kafka consumer group",
    },
  ];

  const services = [
    {
      label: "Kafka queue",
      status: data.kafka.status,
      detail: `Consumer lag ${data.kafka.lag} msgs`,
      icon: Layers,
    },
    {
      label: "API service",
      status: data.api.status,
      detail: `p95 latency ${data.api.p95} ms`,
      icon: Radio,
    },
    {
      label: "PostgreSQL",
      status: data.database.status,
      detail: `${data.database.connections} active connections`,
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
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                <span className="size-1.5 rounded-full bg-success" />
                {s.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="glass rounded-2xl p-5"
      >
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">Throughput vs fraud signals</h2>
            <p className="truncate text-xs text-muted-foreground">
              Streaming window · last 60 minutes
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Live
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics?.perMinute ?? []}>
              <defs>
                <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-danger)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
              <Tooltip {...chartTooltip} />
              <Area
                type="monotone"
                dataKey="transactions"
                stroke="var(--color-primary)"
                fill="url(#gTx)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="fraud"
                stroke="var(--color-danger)"
                fill="url(#gFraud)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
