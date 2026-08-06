import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Delete, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useWallet } from "@/context/WalletContext";
import { AppShell } from "@/components/AppShell";
import type { Transaction } from "@/types/payment";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-3xl"
    >
      {children}
    </motion.div>
  );
}

/** Client-side guard: unauthenticated visitors get bounced to /login. */
export function WalletPage({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login", replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="ambient-bg grid min-h-screen place-items-center text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}

const STATUS_STYLES: Record<Transaction["status"], string> = {
  COMPLETED: "border-success/40 bg-success/10 text-success",
  PENDING: "border-warning/40 bg-warning/10 text-warning",
  FLAGGED: "border-violet-accent/50 bg-violet-accent/10 text-violet-accent",
  FAILED: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: Transaction["status"] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function PinPad({
  open,
  title,
  subtitle,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  const press = (key: string) => {
    if (busy) return;
    if (key === "del") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 6) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 6) setTimeout(() => onSubmit(next), 180);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-sm sm:place-items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-sm rounded-t-3xl p-6 sm:rounded-3xl"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-cyan-accent" /> {title}
                </p>
                {subtitle && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-6 flex justify-center gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full transition-all ${
                    i < pin.length ? "gradient-brand scale-110" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="mb-3 text-center text-xs text-destructive">{error}</p>
            )}
            {busy && (
              <p className="mb-3 text-center text-xs text-muted-foreground">
                Authorizing payment…
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
                k === "" ? (
                  <span key={i} />
                ) : (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => press(k)}
                    className="rounded-xl border border-border/70 bg-secondary/40 py-3 text-lg font-medium transition-colors hover:bg-secondary"
                  >
                    {k === "del" ? <Delete className="mx-auto h-4 w-4" /> : k}
                  </motion.button>
                ),
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}