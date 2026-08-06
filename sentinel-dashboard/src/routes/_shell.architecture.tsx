import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Boxes,
  Database,
  FileText,
  ServerCog,
  ShieldAlert,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_shell/architecture")({
  head: () => ({
    meta: [
      { title: "System Architecture — NordVault Pipeline" },
      {
        name: "description",
        content:
          "Animated view of the distributed pipeline: FastAPI ingest, Kafka, fraud detection, logging, PostgreSQL and alerting.",
      },
      { property: "og:title", content: "System Architecture — NordVault Pipeline" },
      {
        property: "og:description",
        content: "Live service topology with CPU, memory, latency and health per component.",
      },
    ],
  }),
  component: ArchitecturePage,
});

interface Node {
  name: string;
  role: string;
  icon: LucideIcon;
  cpu: number;
  memory: number;
  latency: string;
  health: "Healthy" | "Degraded";
  tone: string;
}

const NODES: Node[] = [
  { name: "Customer", role: "Card & mobile channels", icon: User, cpu: 4, memory: 12, latency: "—", health: "Healthy", tone: "text-cyan" },
  { name: "FastAPI Gateway", role: "Ingest & validation · uvicorn x4", icon: ServerCog, cpu: 46, memory: 61, latency: "38 ms", health: "Healthy", tone: "text-primary" },
  { name: "Kafka Broker", role: "topic: transactions · 3 partitions", icon: Boxes, cpu: 58, memory: 72, latency: "12 ms", health: "Healthy", tone: "text-violet" },
  { name: "Fraud Detection Service", role: "Rules engine + gbm-fraud-v4.2", icon: ShieldAlert, cpu: 74, memory: 68, latency: "89 ms", health: "Degraded", tone: "text-warning" },
  { name: "Logger Service", role: "Immutable audit trail writer", icon: FileText, cpu: 22, memory: 34, latency: "9 ms", health: "Healthy", tone: "text-cyan" },
  { name: "PostgreSQL", role: "transactions · frauds · audit", icon: Database, cpu: 51, memory: 77, latency: "17 ms", health: "Healthy", tone: "text-primary" },
  { name: "Alert Service", role: "Analyst notifications & webhooks", icon: AlertTriangle, cpu: 18, memory: 29, latency: "24 ms", health: "Healthy", tone: "text-violet" },
];

function Connector({ index }: { index: number }) {
  return (
    <div className="relative mx-auto h-14 w-px bg-linear-to-b from-cyan/60 to-violet/60">
      {[0, 1, 2].map((p) => (
        <motion.span
          key={p}
          className="absolute -left-[3px] size-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_var(--color-cyan)]"
          initial={{ top: "-6%", opacity: 0 }}
          animate={{ top: ["-6%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: p * 0.55 + index * 0.18,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value > 70 ? "bg-warning" : "bg-cyan";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass mb-6 rounded-2xl p-5">
        <h2 className="text-base font-semibold">Live pipeline topology</h2>
        <p className="text-xs text-muted-foreground">
          Particles represent transaction events flowing between distributed services.
        </p>
      </div>

      {NODES.map((n, i) => (
        <div key={n.name}>
          <motion.article
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="glass glass-hover rounded-2xl p-5"
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                <n.icon className={`size-5 ${n.tone}`} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold sm:text-base">{n.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{n.role}</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  n.health === "Healthy"
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-warning/40 bg-warning/10 text-warning"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {n.health}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Bar label="CPU" value={n.cpu} />
              <Bar label="Memory" value={n.memory} />
              <div>
                <p className="text-[11px] text-muted-foreground">Latency</p>
                <p className="font-display text-lg font-bold">{n.latency}</p>
              </div>
            </div>
          </motion.article>
          {i < NODES.length - 1 && <Connector index={i} />}
        </div>
      ))}
    </div>
  );
}
