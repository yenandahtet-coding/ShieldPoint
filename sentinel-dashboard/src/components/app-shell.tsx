import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { metricsService } from "@/services/metricsService";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  Settings,
  ShieldAlert,
  Sun,
  X,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Live Monitor", icon: Activity },
  { to: "/frauds", label: "Fraud Detection", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/architecture", label: "Architecture", icon: Network },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!auth.isAuthed()) navigate({ to: "/" });
  }, [navigate]);

  useEffect(() => setOpen(false), [pathname]);

  const title = NAV.find((n) => n.to === pathname)?.label ?? "Dashboard";

  return (
    <div className="app-grid-bg min-h-screen">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-sidebar/70 backdrop-blur-xl lg:block">
          <SidebarContent pathname={pathname} />
        </aside>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar lg:hidden"
              >
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Close navigation"
                >
                  <X className="size-4" />
                </button>
                <SidebarContent pathname={pathname} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-background/70 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
                <p className="truncate text-xs text-muted-foreground">
                  Distributed Financial Transaction &amp; Fraud Detection Pipeline
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-medium text-success sm:inline-flex">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                Live stream
              </span>
              <button
                onClick={toggle}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                onClick={() => {
                  auth.logout();
                  navigate({ to: "/" });
                }}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  const { data } = useQuery({
    queryKey: ["sidebar-metrics"],
    queryFn: metricsService.getMetrics,
    refetchInterval: 5000
  });

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/dashboard" className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary via-cyan to-violet">
          <ShieldAlert className="size-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">NORDVAULT</p>
          <p className="truncate text-[11px] text-muted-foreground">Fraud Operations</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-linear-to-b from-cyan to-violet"
                />
              )}
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
