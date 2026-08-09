import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Eye, EyeOff, Landmark, Lock, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — NordVault Fraud Operations" },
      {
        name: "description",
        content:
          "Secure operator sign-in for the NordVault distributed fraud detection monitoring console.",
      },
      { property: "og:title", content: "Sign in — NordVault Fraud Operations" },
      {
        property: "og:description",
        content: "Secure operator sign-in for the NordVault fraud monitoring console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Enter your operator credentials");
      return;
    }
    setLoading(true);
    try {
      await auth.login(username, password);
      toast.success("Authenticated — opening operations console");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-grid-bg grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-primary via-cyan to-violet">
            <Landmark className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-base font-bold tracking-tight">NORDVAULT BANK</p>
            <p className="text-xs text-muted-foreground">Financial Crime Technology</p>
          </div>
        </div>

        <div className="max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold leading-tight"
          >
            Distributed transaction &amp; <span className="text-gradient">fraud detection</span>{" "}
            pipeline
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 text-sm leading-relaxed text-muted-foreground"
          >
            Streaming ingestion over Kafka, rule and score based detection, immutable audit logging
            and instant analyst alerting — monitored from a single operations console.
          </motion.p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["1.2k/s", "Ingest rate"],
              ["< 90ms", "Scoring p95"],
              ["99.98%", "Uptime"],
            ].map(([v, l]) => (
              <div key={l} className="glass rounded-xl p-3">
                <p className="font-display text-lg font-bold">{v}</p>
                <p className="text-[11px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" /> PSD2 · ISO 27001 · SOC 2 Type II aligned
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass w-full max-w-md rounded-3xl p-8"
        >
          <div className="mb-8 lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-primary via-cyan to-violet">
              <Landmark className="size-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Operator sign-in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Restricted access. Activity on this console is logged and audited.
          </p>

          <label className="mt-8 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Username
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-surface-2/50 px-3 focus-within:border-cyan/60">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground"
              placeholder="analyst.id"
            />
          </div>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-surface-2/50 px-3 focus-within:border-cyan/60">
            <Lock className="size-4 shrink-0 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-linear-to-r from-primary via-primary to-violet py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Verifying credentials…" : "Sign in securely"}
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo environment — Use admin / admin to sign in.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
