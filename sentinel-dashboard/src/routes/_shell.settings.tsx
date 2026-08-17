import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Save, Server, Shield, Database, Radio, Bell, Moon, Sun, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const getBackendUrl = () => localStorage.getItem("backendUrl") || "http://127.0.0.1:8000/api";
const setBackendUrl = (url: string) => localStorage.setItem("backendUrl", url);

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NordVault Console" },
      {
        name: "description",
        content:
          "Configure the FastAPI backend endpoint, review Kafka and database connectivity and switch console theme.",
      },
      { property: "og:title", content: "Settings — NordVault Console" },
      {
        property: "og:description",
        content: "Backend endpoint, infrastructure connectivity and appearance settings.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [url, setUrl] = useState("http://127.0.0.1:8000/api");

  useEffect(() => setUrl(getBackendUrl()), []);

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <h2 className="text-base font-semibold">Backend endpoint</h2>
        <p className="text-xs text-muted-foreground">
          Base URL used by the Axios client for /dashboard, /transactions, /frauds, /analytics,
          /alerts, /login and /transaction.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-52 flex-1 rounded-xl border border-input bg-surface-2/50 px-3 py-2.5 font-mono text-sm outline-hidden focus:border-cyan/60"
          />
          <button
            onClick={() => {
              setBackendUrl(url);
              toast.success("Backend URL saved");
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Save className="size-4" /> Save
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Mock responses are served until the FastAPI service is reachable.
        </p>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Kafka", detail: "3 partitions · lag 42", icon: Layers, status: "Healthy" },
          { label: "PostgreSQL", detail: "primary · 41 connections", icon: Database, status: "Connected" },
          { label: "FastAPI", detail: "4 uvicorn workers", icon: Server, status: "Operational" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="glass rounded-2xl p-5"
          >
            <s.icon className="size-4 text-cyan" />
            <p className="mt-3 text-sm font-semibold">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.detail}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {s.status}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl p-5"
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground">
            Dark operations theme is recommended for 24/7 monitoring rooms.
          </p>
        </div>
        <button
          onClick={toggle}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Switch to light" : "Switch to dark"}
        </button>
      </motion.section>
    </div>
  );
}
