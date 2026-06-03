"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Building2, ChevronDown, ClipboardList, CreditCard, FileCheck2, LayoutDashboard, LogOut, Menu, Monitor, Moon, Palette, Search, ShieldCheck, Sun, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { UserRole } from "@/lib/auth";
import { SiteFooter } from "@/components/portal/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND_THEME_CHANGE_EVENT, getBrandTheme, readStoredBrandTheme } from "@/lib/brand-theme";
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
  { href: "/admin/themes", label: "Themes", icon: Palette, reviewerOnly: true },
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

function compactId(value: string): string {
  const normalized = value.trim();
  if (normalized.length <= 18) {
    return normalized;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-6)}`;
}

export function AppShell({
  children,
  role,
  userName,
  contactId,
  accountId,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [theme, setTheme] = useState<ThemeSetting>(() => getStoredTheme());
  const [brandTheme, setBrandTheme] = useState<string>(() => readStoredBrandTheme());
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);

  const allowedNav = useMemo(
    () => navItems.filter((item) => !item.reviewerOnly || role === "reviewer"),
    [role]
  );

  const roleLabel = role === "reviewer" ? "Reviewer" : "Supplier";
  const activeBrand = useMemo(() => getBrandTheme(brandTheme), [brandTheme]);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allowedNav.filter((item) => item.label.toLowerCase().includes(query)).slice(0, 5);
  }, [allowedNav, searchQuery]);

  const quickLinks = useMemo(() => {
    const links = [
      { label: "Questionnaires", href: "/questionnaires" },
      { label: "Test Center", href: "/test-center" },
    ];

    if (role === "reviewer") {
      return [{ label: "Access Requests", href: "/admin/requests" }, ...links];
    }

    return links;
  }, [role]);

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

  useEffect(() => {
    const onBrandThemeChange = (event: Event) => {
      const payload = event as CustomEvent<{ themeId?: string }>;
      setBrandTheme(payload.detail?.themeId ?? readStoredBrandTheme());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "supplierhub-brand-theme") {
        setBrandTheme(readStoredBrandTheme());
      }
    };

    window.addEventListener(BRAND_THEME_CHANGE_EVENT, onBrandThemeChange as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(BRAND_THEME_CHANGE_EVENT, onBrandThemeChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function applyTheme(setting: ThemeSetting) {
    setTheme(setting);
    setStoredTheme(setting);
    document.documentElement.classList.toggle("dark", resolveDarkMode(setting));
  }

  function handleQuickLinkNavigate(href: string) {
    setIsQuickLinksOpen(false);
    router.push(href);
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

  function handleSearchSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (searchResults.length > 0) {
      router.push(searchResults[0].href);
      setSearchQuery("");
    }
  }

  return (
    <div id="top" className="min-h-screen bg-transparent text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <div className="min-w-0 flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30">
                <span className="text-[10px] font-semibold uppercase tracking-wide">{activeBrand.logoMark}</span>
              </div>
              <div className="min-w-0 leading-tight">
                <p className="max-w-[10.5rem] truncate font-semibold tracking-tight text-foreground sm:max-w-[12rem] xl:max-w-[14rem]">{activeBrand.headerTitle}</p>
                <p className="max-w-[10.5rem] truncate text-xs text-muted-foreground sm:max-w-[12rem] xl:max-w-[14rem]">{activeBrand.headerSubtitle}</p>
              </div>
            </Link>
          </div>

          <div className="relative hidden max-w-lg flex-1 lg:block">
            <form onSubmit={handleSearchSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, tools, and workflows"
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-28 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring"
                aria-label="Global navigation search"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Enter to open
              </span>
            </form>
            {searchQuery.trim() && (
              <div className="absolute mt-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-xl">
                {searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto py-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.href}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                        onClick={() => {
                          router.push(result.href);
                          setSearchQuery("");
                        }}
                      >
                        <span>{result.label}</span>
                        <span className="text-xs text-muted-foreground">{result.href}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No matching pages found.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative hidden lg:block">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => setIsQuickLinksOpen((current) => !current)}
                aria-expanded={isQuickLinksOpen}
                aria-controls="quick-links-menu"
              >
                Quick Links
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isQuickLinksOpen && "rotate-180")} />
              </Button>
              {isQuickLinksOpen ? (
                <div
                  id="quick-links-menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-48 rounded-md border border-border bg-card p-1 shadow-lg"
                >
                  {quickLinks.map((link) => (
                    <button
                      key={link.href}
                      type="button"
                      className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                      onClick={() => handleQuickLinkNavigate(link.href)}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                "hidden items-center gap-2 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium md:inline-flex",
                healthBadgeClasses
              )}
              title="Automatically checks protected health endpoint"
            >
              <span className={cn("h-2 w-2 rounded-full", healthDotClasses)} />
              {healthLabel}
            </div>
            <label className="hidden items-center gap-2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground md:inline-flex">
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
            <Badge className="hidden lg:inline-flex">{roleLabel}</Badge>
            <div className="hidden min-w-0 max-w-[12rem] text-right 2xl:block">
              <p className="truncate text-sm font-medium text-foreground" title={userName ?? "Signed-in user"}>
                {userName ?? "Signed-in user"}
              </p>
              <p
                className="truncate text-[11px] text-muted-foreground"
                title={contactId ? `Contact: ${contactId}` : "Contact: not linked"}
              >
                {contactId ? `Contact: ${compactId(contactId)}` : "Contact: not linked"}
              </p>
              <p
                className="truncate text-[11px] text-muted-foreground"
                title={accountId ? `Account: ${accountId}` : "Account: not linked"}
              >
                {accountId ? `Account: ${compactId(accountId)}` : "Account: not linked"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="px-2.5 sm:px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
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
          <div className="mb-3 rounded-md border border-border bg-muted/35 p-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quick Open</p>
            <div className="flex flex-wrap gap-1.5">
              {quickLinks.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  className="rounded-full bg-card px-2 py-1 text-xs text-foreground hover:bg-muted"
                  onClick={() => {
                    router.push(action.href);
                    setIsSidebarOpen(false);
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
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

      <SiteFooter brandLabel={activeBrand.company === "Neutral" ? "Supplier Hub" : activeBrand.company} />
    </div>
  );
}
