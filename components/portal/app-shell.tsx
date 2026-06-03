"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, ClipboardList, CreditCard, FileCheck2, LayoutDashboard, LogOut, Menu, Monitor, Moon, ShieldCheck, Sun, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { UserRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  reviewerOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { href: "/capabilities", label: "Capabilities", icon: Building2 },
  { href: "/certifications", label: "Certifications", icon: FileCheck2 },
  { href: "/credit", label: "Credit", icon: CreditCard },
  { href: "/test-center", label: "Test Center", icon: Activity },
  { href: "/admin", label: "Admin", icon: ShieldCheck, reviewerOnly: true },
  { href: "/admin/requests", label: "Access Requests", icon: ClipboardList, reviewerOnly: true },
];

type AppShellProps = {
  children: React.ReactNode;
  role: UserRole;
  userName?: string | null;
  contactId?: string | null;
  accountId?: string | null;
};

type HealthStatus = "checking" | "ok" | "degraded";
type ThemeSetting = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "supplierhub-theme";

function getStoredTheme(): ThemeSetting {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

function setStoredTheme(setting: ThemeSetting): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, setting);
  } catch {
    // Ignore storage write failures (privacy mode/restricted storage).
  }
}

function resolveDarkMode(setting: ThemeSetting): boolean {
  if (setting === "dark") return true;
  if (setting === "light") return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function AppShell({
  children,
  role,
  userName,
  contactId,
  accountId,
}: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [theme, setTheme] = useState<ThemeSetting>(() => getStoredTheme());

  const allowedNav = useMemo(
    () => navItems.filter((item) => !item.reviewerOnly || role === "reviewer"),
    [role]
  );

  const roleLabel = role === "reviewer" ? "Reviewer" : "Supplier";

  useEffect(() => {
    let isMounted = true;

    async function runHealthCheck() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });

        if (!isMounted) {
          return;
        }

        setHealthStatus(response.ok ? "ok" : "degraded");
      } catch {
        if (!isMounted) {
          return;
        }

        setHealthStatus("degraded");
      }
    }

    void runHealthCheck();
    const intervalId = setInterval(() => {
      void runHealthCheck();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolveDarkMode(theme));

    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      const active = getStoredTheme();
      if (active === "system") {
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncSystemTheme);
      return () => media.removeEventListener("change", syncSystemTheme);
    }

    media.addListener(syncSystemTheme);
    return () => media.removeListener(syncSystemTheme);
  }, [theme]);

  function applyTheme(setting: ThemeSetting) {
    setTheme(setting);
    setStoredTheme(setting);
    document.documentElement.classList.toggle("dark", resolveDarkMode(setting));
  }

  const healthBadgeClasses =
    healthStatus === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : healthStatus === "degraded"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  const healthDotClasses =
    healthStatus === "ok"
      ? "bg-emerald-500"
      : healthStatus === "degraded"
        ? "bg-rose-500"
        : "bg-slate-400";

  const healthLabel =
    healthStatus === "ok"
      ? "System Healthy"
      : healthStatus === "degraded"
        ? "System Check Failed"
        : "Checking System";

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  function handleLogout() {
    window.location.href = "/api/demo-auth/logout?callbackUrl=/login";
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="font-semibold tracking-tight text-foreground">Supplier Hub</p>
                <p className="text-xs text-muted-foreground">Onboarding Portal</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "hidden items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium md:inline-flex",
                healthBadgeClasses
              )}
              title="Automatically checks protected health endpoint"
            >
              <span className={cn("h-2 w-2 rounded-full", healthDotClasses)} />
              {healthLabel}
            </div>
            <label className="hidden items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground md:inline-flex">
              <ThemeIcon className="h-3.5 w-3.5" />
              Theme
              <select
                value={theme}
                onChange={(e) => applyTheme(e.target.value as ThemeSetting)}
                className="rounded border border-border bg-card px-1.5 py-0.5 text-xs text-foreground"
                aria-label="Theme setting"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <Badge>{roleLabel}</Badge>
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-foreground">{userName ?? "Signed-in user"}</p>
              <p className="text-xs text-muted-foreground">
                {contactId ? `Contact: ${contactId}` : "Contact: not linked"}
              </p>
              <p className="text-xs text-muted-foreground">
                {accountId ? `Account: ${accountId}` : "Account: not linked"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-72 border-r border-border/80 bg-card/70 p-4 md:block">
          <nav className="space-y-1">
            {allowedNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div
          className={cn(
            "fixed inset-0 z-40 bg-slate-950/35 transition-opacity md:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-72 border-r border-border bg-card p-4 shadow-xl transition-transform md:hidden",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Navigation</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <label className="mb-3 flex items-center gap-2 rounded-md border border-border bg-card px-2 py-2 text-xs text-muted-foreground">
            <ThemeIcon className="h-3.5 w-3.5" />
            Theme
            <select
              value={theme}
              onChange={(e) => applyTheme(e.target.value as ThemeSetting)}
              className="ml-auto rounded border border-border bg-card px-1.5 py-0.5 text-xs text-foreground"
              aria-label="Theme setting"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <nav className="space-y-1">
            {allowedNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-4rem)] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
