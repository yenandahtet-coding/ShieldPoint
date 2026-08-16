import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { metricsService } from "@/services/metricsService";
import { CardSkeleton } from "@/components/skeletons";
import { CHART_COLORS, chartTooltip } from "@/components/chart-theme";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => ({
    meta: [
      { title: "Fraud Analytics — NordVault" },
      {
        name: "description",
        content:
          "Throughput, fraud trend, risk distribution, merchant categories and geography analytics for the detection pipeline.",
      },
      { property: "og:title", content: "Fraud Analytics — NordVault" },
      {
        property: "og:description",
        content: "Throughput, fraud trends, risk distribution and geography analytics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function Panel({
  title,
  subtitle,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass rounded-2xl p-5 ${className}`}
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 h-64 w-full">{children}</div>
    </motion.section>
  );
}

function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: metricsService.getMetrics });
  if (isLoading || !data) return <CardSkeleton count={6} />;

  const axis = { stroke: "var(--color-muted-foreground)", fontSize: 11, tickLine: false } as const;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Transactions per minute" subtitle="Rolling 60-minute ingest window" delay={0}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.perMinute}>
            <defs>
              <linearGradient id="aTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} />
            <Tooltip {...chartTooltip} />
            <Area
              type="monotone"
              dataKey="transactions"
              stroke="var(--color-cyan)"
              fill="url(#aTx)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Fraud trend" subtitle="Detected vs blocked, last 14 days" delay={0.05}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.fraudTrend}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" {...axis} />
            <YAxis {...axis} />
            <Tooltip {...chartTooltip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="fraud" stroke="var(--color-danger)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="blocked" stroke="var(--color-violet)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Risk score distribution" subtitle="Scored authorisations by band" delay={0.1}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.riskDistribution}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="bucket" {...axis} />
            <YAxis {...axis} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.riskDistribution?.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Transactions by country" subtitle="Corridor volume" delay={0.2}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byCountry} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey="country" width={92} {...axis} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="transactions" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Fraud by country" subtitle="Confirmed fraud cases per corridor" delay={0.25}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byCountry} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey="country" width={92} {...axis} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="fraud" fill="var(--color-danger)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        title="Hourly transaction volume"
        subtitle="24-hour profile across all channels"
        delay={0.3}
        className="xl:col-span-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.hourly}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="hour" {...axis} />
            <YAxis {...axis} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="volume" fill="var(--color-violet)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
