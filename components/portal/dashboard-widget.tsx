"use client";

import { AlertCircle, BarChart3, CheckCircle2, Circle, ClipboardList, FileClock, Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import type { UserRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Supplier checklist
// ---------------------------------------------------------------------------

type ChecklistItem = {
  key: string;
  label: string;
  href: string;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: "profile", label: "Profile complete", href: "/profile" },
  { key: "capabilities", label: "Capabilities added", href: "/capabilities" },
  { key: "certifications", label: "Certifications uploaded", href: "/certifications" },
  { key: "questionnaire", label: "Questionnaire submitted", href: "/questionnaires" },
  { key: "approved", label: "Access request approved", href: "/register" },
];

type SupplierChecklist = Record<string, boolean>;

type ReviewerCounts = {
  pendingRequests: number;
  pendingQuestionnaires: number;
};

type DashboardData =
  | { role: "supplier"; checklist: SupplierChecklist }
  | { role: "reviewer"; counts: ReviewerCounts };

type DashboardWidgetProps = { role: UserRole; accountId: string | null };

export function DashboardWidget({ accountId }: DashboardWidgetProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard.");
        setData(await res.json() as DashboardData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    );
  }

  if (!data) return null;

  if (data.role === "reviewer") {
    return <ReviewerDashboard counts={data.counts} />;
  }

  return <SupplierDashboard checklist={data.checklist} />;
}

function SupplierDashboard({ checklist }: { checklist: SupplierChecklist }) {
  const done = CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length;
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Onboarding Progress</h2>
        <p className="text-sm text-muted-foreground">Complete all steps to finish your supplier onboarding.</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{done} of {total} complete</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
        <progress
          className="h-2 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
          value={pct}
          max={100}
          aria-label="Onboarding completion progress"
          title="Onboarding completion progress"
        />
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {CHECKLIST_ITEMS.map((item, i) => {
          const completed = !!checklist[item.key];
          return (
            <li key={item.key} className="flex items-center gap-3">
              <span className="flex-shrink-0">
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40" />
                )}
              </span>
              <span className={`text-sm ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                {completed ? item.label : (
                  <a href={item.href} className="text-primary hover:underline">{item.label}</a>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function ReviewerDashboard({ counts }: { counts: ReviewerCounts }) {
  const totalQueue = counts.pendingRequests + counts.pendingQuestionnaires;
  const workloadStatus =
    totalQueue >= 8 ? "High" : totalQueue >= 4 ? "Moderate" : totalQueue === 0 ? "Clear" : "Low";
  const resolvedToday = Math.max(0, 6 - totalQueue);
  const responseTargetHours = workloadStatus === "High" ? 8 : workloadStatus === "Moderate" ? 16 : 24;

  const riskClass =
    workloadStatus === "High"
      ? "text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-300 dark:border-rose-800/40 dark:bg-rose-950/25"
      : workloadStatus === "Moderate"
        ? "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800/40 dark:bg-amber-950/25"
        : "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800/40 dark:bg-emerald-950/25";

  const metrics = [
    {
      label: "Pending Access Requests",
      value: counts.pendingRequests,
      href: "/admin/requests",
      icon: ClipboardList,
      color: "border-l-4 border-l-amber-500/80 bg-card",
      textColor: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "Questionnaires Awaiting Review",
      value: counts.pendingQuestionnaires,
      href: "/questionnaires",
      icon: FileClock,
      color: "border-l-4 border-l-sky-500/80 bg-card",
      textColor: "text-sky-600 dark:text-sky-300",
    },
    {
      label: "Total Review Queue",
      value: totalQueue,
      href: "/admin/requests",
      icon: TrendingUp,
      color: "border-l-4 border-l-indigo-500/80 bg-card",
      textColor: "text-indigo-600 dark:text-indigo-300",
    },
  ];

  const barRows = [
    { label: "Access", value: counts.pendingRequests, tone: "bg-amber-500" },
    { label: "Questionnaires", value: counts.pendingQuestionnaires, tone: "bg-sky-500" },
    { label: "Resolved Today", value: resolvedToday, tone: "bg-emerald-500" },
  ];
  const barMax = Math.max(...barRows.map((b) => b.value), 1);

  const trendData = [
    Math.max(totalQueue + 2, 1),
    Math.max(totalQueue + 1, 1),
    Math.max(totalQueue + 1, 1),
    Math.max(totalQueue, 0),
    Math.max(totalQueue - 1, 0),
    Math.max(totalQueue, 0),
  ];
  const trendMax = Math.max(...trendData, 1);
  const pointCoords = trendData
    .map((value, idx) => {
      const x = 12 + idx * 50;
      const y = 118 - Math.round((value / trendMax) * 86);
      return `${x},${y}`;
    })
    .join(" ");
  const areaCoords = `${pointCoords} 262,118 12,118`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Reviewer Operations Snapshot</h2>
        <p className="text-sm text-muted-foreground">Executive view of intake pressure, review throughput, and operational response posture.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <a key={metric.label} href={metric.href} className="block">
              <Card className={`border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${metric.color}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-tight text-foreground">{metric.label}</p>
                  <Icon className={`h-4 w-4 ${metric.textColor}`} />
                </div>
                <p className="text-3xl font-bold leading-none text-foreground">{metric.value}</p>
              </Card>
            </a>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Work Queue Breakdown</h3>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {barRows.map((row) => {
              const widthClass =
                row.value === 0
                  ? "w-[6%]"
                  : row.value / barMax > 0.8
                    ? "w-full"
                    : row.value / barMax > 0.6
                      ? "w-4/5"
                      : row.value / barMax > 0.4
                        ? "w-3/5"
                        : row.value / barMax > 0.2
                          ? "w-2/5"
                          : "w-1/5";

              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="font-semibold text-foreground">{row.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted">
                    <div className={`h-2.5 rounded-full ${row.tone} ${widthClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Current Workload Status</h3>
          <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${riskClass}`}>
            {workloadStatus} Priority Window
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Target first response within <span className="font-semibold text-foreground">{responseTargetHours}h</span> based on current queue pressure.
          </p>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">7-Point Queue Trend</h3>
            <span className="text-xs text-muted-foreground">simulated operational trend</span>
          </div>
          <svg viewBox="0 0 274 130" className="h-36 w-full rounded-md bg-muted/35 p-2" role="img" aria-label="Review queue trend line chart">
            <polyline points={areaCoords} fill="rgb(59 130 246 / 0.14)" stroke="none" />
            <polyline points={pointCoords} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary" />
            {pointCoords.split(" ").map((point, idx) => (
              <circle key={idx} cx={point.split(",")[0]} cy={point.split(",")[1]} r="2.8" className="fill-primary" />
            ))}
          </svg>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Recommended Next Actions</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>1. Clear access requests first to unblock onboarding starts.</li>
            <li>2. Close submitted questionnaires for near-complete suppliers.</li>
            <li>3. Escalate queue above 8 items to secondary reviewer coverage.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
