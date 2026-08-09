import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { healthService } from "@/services/healthService";

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

interface NodeData {
  name: string;
  role: string;
  icon: LucideIcon;
  health: "Healthy" | "Degraded" | "Offline";
  tone: string;
}

function NodeCard({ node, delay = 0 }: { node: NodeData, delay?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.4 }}
      className="glass glass-hover rounded-2xl p-5"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
          <node.icon className={`size-5 ${node.tone}`} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold sm:text-base">{node.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{node.role}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            node.health === "Healthy"
              ? "border-success/40 bg-success/10 text-success"
              : node.health === "Offline"
                ? "border-danger/40 bg-danger/10 text-danger"
                : "border-warning/40 bg-warning/10 text-warning"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {node.health}
        </span>
      </div>
    </motion.article>
  );
}

function Connector({ vertical = true }: { vertical?: boolean }) {
  if (!vertical) {
    return (
      <div className="relative h-px w-14 bg-linear-to-r from-cyan/60 to-violet/60 my-auto">
        {[0, 1, 2].map((p) => (
          <motion.span
            key={p}
            className="absolute -top-[3px] size-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_var(--color-cyan)]"
            initial={{ left: "-6%", opacity: 0 }}
            animate={{ left: ["-6%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: p * 0.55,
              ease: "linear",
            }}
          />
        ))}
      </div>
    );
  }
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
            delay: p * 0.55,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

function ArchitecturePage() {
  const { data: health } = useQuery({
    queryKey: ["dashboard-health"],
    queryFn: healthService.getHealth,
    refetchInterval: 10000,
  });

  const getStatus = (status?: string) => 
    ["UP", "OK", "CONNECTED", "connected"].includes(status?.toUpperCase() || "") ? "Healthy" : "Offline";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="glass mb-6 rounded-2xl p-5">
        <h2 className="text-base font-semibold">Live pipeline topology</h2>
        <p className="text-xs text-muted-foreground">
          Real-time Event-Driven Architecture status across microservices.
        </p>
      </div>

      <div className="flex flex-col items-center">
        {/* User */}
        <div className="w-full max-w-sm">
          <NodeCard node={{ name: "Customer", role: "React Web App", icon: User, health: "Healthy", tone: "text-cyan" }} delay={0} />
        </div>
        <Connector />

        {/* API Gateway */}
        <div className="w-full max-w-sm">
          <NodeCard node={{ name: "FastAPI Gateway", role: "api-service :8000", icon: ServerCog, health: getStatus(health?.api?.status), tone: "text-primary" }} delay={0.1} />
        </div>
        <Connector />

        {/* Kafka */}
        <div className="w-full max-w-sm">
          <NodeCard node={{ name: "Kafka Broker", role: "topics: transactions, frauds", icon: Boxes, health: "Healthy", tone: "text-violet" }} delay={0.2} />
        </div>
        <Connector />

        {/* Branches */}
        <div className="w-full flex flex-col md:flex-row justify-center gap-8 mt-2">
          
          {/* Branch A: Logger */}
          <div className="flex-1 max-w-sm flex flex-col">
            <NodeCard node={{ name: "Logger Service", role: "logger-service :8001", icon: FileText, health: getStatus(health?.logger?.status), tone: "text-cyan" }} delay={0.3} />
            <Connector />
            <NodeCard node={{ name: "PostgreSQL", role: "Database", icon: Database, health: getStatus(health?.logger?.postgresql || (health?.logger as any)?.database), tone: "text-primary" }} delay={0.4} />
          </div>

          {/* Branch B: Fraud -> Notification */}
          <div className="flex-1 max-w-sm flex flex-col">
            <NodeCard node={{ name: "Fraud Detection", role: "fraud-service :8002", icon: ShieldAlert, health: getStatus(health?.fraud?.status), tone: "text-warning" }} delay={0.3} />
            <Connector />
            <NodeCard node={{ name: "MongoDB", role: "Database", icon: Database, health: getStatus(health?.fraud?.mongodb), tone: "text-success" }} delay={0.4} />
            <Connector />
            <NodeCard node={{ name: "Notification Service", role: "notification-service :8003", icon: AlertTriangle, health: getStatus(health?.notification?.status), tone: "text-violet" }} delay={0.5} />
          </div>

        </div>
      </div>
    </div>
  );
}
