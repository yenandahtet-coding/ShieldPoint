import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { History, LayoutGrid, LogOut, QrCode, Send, Wallet, User } from "lucide-react";
import type { ReactNode } from "react";
import { useWallet } from "@/context/WalletContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/pay/phone", label: "Send", icon: Send },
  { to: "/pay/qr", label: "Scan & QR", icon: QrCode },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useWallet();

  return (
    <div className="ambient-bg min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-border/60 px-5 py-8 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <span className="gradient-brand grid h-10 w-10 shrink-0 place-items-center rounded-xl">
              <Wallet className="h-5 w-5 text-background" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Nova Pay</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="glass absolute inset-0 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4 shrink-0" />
                  <span className="relative truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      <nav className="glass fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-2xl p-1.5 lg:hidden">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill-mobile"
                  className="gradient-brand absolute inset-0 rounded-xl opacity-20"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}