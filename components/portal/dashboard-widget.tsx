"use client";

import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
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
  const stats = [
    { label: "Pending Access Requests", value: counts.pendingRequests, href: "/admin/requests", color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/25 dark:border-amber-800/40" },
    { label: "Questionnaires Awaiting Review", value: counts.pendingQuestionnaires, href: "/questionnaires", color: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/25 dark:border-blue-800/40" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Reviewer Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="block">
            <Card className={`border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${s.color}`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-sm font-medium">{s.label}</p>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
