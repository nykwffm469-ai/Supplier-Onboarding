"use client";

import { AlertCircle, ChevronRight, ClipboardCheck, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { VendorQuestionnaire } from "@/lib/server/questionnaires";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuestionnaireWizard } from "@/components/portal/questionnaire-wizard";
import { cn } from "@/lib/utils";

type Data = {
  questionnaires: VendorQuestionnaire[];
  templates?: { msmfg_questionnairetemplateid: string; msmfg_name?: string }[];
};

const statusColors: Record<string, string> = {
  Draft: "border-amber-200 bg-amber-50 text-amber-800",
  Submitted: "border-blue-200 bg-blue-50 text-blue-800",
  Reviewed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

type QuestionnairesListProps = {
  role: string;
  accountId: string | null;
  contactId: string | null;
};

export function QuestionnairesList({ role, accountId, contactId }: QuestionnairesListProps) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [assignTemplateId, setAssignTemplateId] = useState("");
  const [assignAccountId, setAssignAccountId] = useState(accountId ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/questionnaires");
      if (!res.ok) throw new Error("Failed to load questionnaires.");
      setData(await res.json() as Data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() { await load(); }
    if (!cancelled) void run();
    return () => { cancelled = true; };
  }, [load]);

  async function handleAssign() {
    if (!assignTemplateId || !assignAccountId || !contactId) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/questionnaires/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: assignTemplateId, accountId: assignAccountId, contactId }),
      });
      if (!res.ok) throw new Error("Assign failed.");
      await load();
    } catch {
      // ignore for now, shown in future toast
    } finally {
      setAssigning(false);
    }
  }

  if (selectedId) {
    return <QuestionnaireDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Questionnaires</h1>
          <p className="text-sm text-muted-foreground">Answer assigned questionnaires to complete onboarding.</p>
        </div>
        {role !== "reviewer" && (
          <Button onClick={() => setShowWizard(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create New
          </Button>
        )}
      </div>

      {showWizard && (
        <QuestionnaireWizard
          onClose={() => setShowWizard(false)}
          onComplete={() => { void load(); setShowWizard(false); }}
        />
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.questionnaires.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No questionnaires assigned yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.questionnaires.map((q) => (
                <button
                  key={q.msmfg_vendorquestionnaireid}
                  onClick={() => setSelectedId(q.msmfg_vendorquestionnaireid)}
                  className="w-full text-left"
                >
                  <Card className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:border-primary/40 hover:bg-muted/30">
                    <div>
                      <p className="font-medium text-foreground">{q.msmfg_name ?? "Questionnaire"}</p>
                      {q.msmfg_template_name && (
                        <p className="text-xs text-muted-foreground">{q.msmfg_template_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          statusColors[q.msmfg_status ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        {q.msmfg_status ?? "Draft"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}

          {role === "reviewer" && data.templates && (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">Assign Questionnaire</h2>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Template</label>
                  <select
                    value={assignTemplateId}
                    onChange={(e) => setAssignTemplateId(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                    aria-label="Questionnaire template"
                    title="Questionnaire template"
                  >
                    <option value="">— Select template —</option>
                    {data.templates.map((t) => (
                      <option key={t.msmfg_questionnairetemplateid} value={t.msmfg_questionnairetemplateid}>
                        {t.msmfg_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-48 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Account ID</label>
                  <input
                    className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm font-mono text-foreground"
                    value={assignAccountId}
                    onChange={(e) => setAssignAccountId(e.target.value)}
                    placeholder="account UUID"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => void handleAssign()}
                    disabled={assigning || !assignTemplateId || !assignAccountId}
                  >
                    {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Assign
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view (answer questions)
// ---------------------------------------------------------------------------

type QuestionnaireQuestion = {
  msmfg_questionnairequestionid: string;
  msmfg_answer?: string | null;
  msmfg_question_name?: string;
  msmfg_question_text?: string;
  msmfg_question_type?: string;
};

type DetailData = {
  msmfg_vendorquestionnaireid: string;
  msmfg_name?: string;
  msmfg_status?: string;
  questions: QuestionnaireQuestion[];
};

function QuestionnaireDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/questionnaires/${id}`);
        if (!res.ok) throw new Error("Failed to load questionnaire.");
        const d = await res.json() as DetailData;
        setDetail(d);
        const init: Record<string, string> = {};
        for (const q of d.questions) {
          init[q.msmfg_questionnairequestionid] = q.msmfg_answer ?? "";
        }
        setAnswers(init);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/questionnaires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([qId, answer]) => ({
            questionnaireQuestionId: qId,
            answer,
          })),
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch(`/api/questionnaires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submit: true,
          answers: Object.entries(answers).map(([qId, answer]) => ({
            questionnaireQuestionId: qId,
            answer,
          })),
        }),
      });
      setDetail((prev) => prev ? { ...prev, msmfg_status: "Submitted" } : prev);
    } finally {
      setSubmitting(false);
    }
  }

  const questionsByType = (detail?.questions ?? []).reduce<Record<string, QuestionnaireQuestion[]>>(
    (acc, q) => {
      const type = q.msmfg_question_type ?? "Other";
      acc[type] ??= [];
      acc[type].push(q);
      return acc;
    },
    {}
  );

  const isSubmitted = detail?.msmfg_status === "Submitted" || detail?.msmfg_status === "Reviewed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{detail?.msmfg_name ?? "Questionnaire"}</h1>
          {detail?.msmfg_status && (
            <span className={cn(
              "inline-block rounded-full border px-2 py-0.5 text-xs font-medium mt-1",
              statusColors[detail.msmfg_status] ?? "border-slate-200 bg-slate-50 text-slate-600"
            )}>
              {detail.msmfg_status}
            </span>
          )}
        </div>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {!loading && detail && Object.entries(questionsByType).map(([type, qs]) => (
        <Card key={type} className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Badge>{type}</Badge>
            <h2 className="text-sm font-semibold text-foreground">{type} Questions</h2>
          </div>
          <div className="space-y-5">
            {qs.map((q, i) => (
              <div key={q.msmfg_questionnairequestionid} className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                  {q.msmfg_question_text ?? q.msmfg_question_name ?? "Question"}
                </label>
                <textarea
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/50 disabled:text-muted-foreground"
                  rows={3}
                  disabled={isSubmitted}
                  value={answers[q.msmfg_questionnairequestionid] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.msmfg_questionnairequestionid]: e.target.value,
                    }))
                  }
                  placeholder={isSubmitted ? "—" : "Enter your answer…"}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {!loading && !isSubmitted && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
