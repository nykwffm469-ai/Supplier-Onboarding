"use client";

import { AlertCircle, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/use-toast";

type TemplateOption = {
  msmfg_questionnairetemplateid: string;
  msmfg_name?: string;
};

type DetailData = {
  msmfg_vendorquestionnaireid: string;
  msmfg_name?: string;
  msmfg_status?: string;
  questions: Array<{
    msmfg_questionnairequestionid: string;
    msmfg_answer?: string | null;
    msmfg_question_name?: string;
    msmfg_question_text?: string;
    msmfg_question_type?: string;
  }>;
};

type WizardStep = "select-template" | "preview" | "answering";

type QuestionnaireWizardProps = {
  onClose: () => void;
  onComplete?: (questionnaireId: string) => void;
};

export function QuestionnaireWizard({ onClose, onComplete }: QuestionnaireWizardProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState<WizardStep>("select-template");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTemplates(true);
      setError(null);
      try {
        const res = await fetch("/api/questionnaires");
        if (!res.ok) throw new Error("Failed to load templates.");
        const json = (await res.json()) as { templates?: TemplateOption[] };
        if (!cancelled) {
          setTemplates(json.templates ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // Load template detail when template is selected
  const loadDetail = useCallback(async (templateId: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      // Create a draft questionnaire and immediately fetch it
      const createRes = await fetch("/api/questionnaires/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!createRes.ok) throw new Error("Failed to create questionnaire.");
      const created = (await createRes.json()) as { questionnaireId: string };

      const detailRes = await fetch(`/api/questionnaires/${created.questionnaireId}`);
      if (!detailRes.ok) throw new Error("Failed to load questionnaire details.");
      const detailData = (await detailRes.json()) as DetailData;

      setDetail(detailData);
      const init: Record<string, string> = {};
      for (const q of detailData.questions) {
        init[q.msmfg_questionnairequestionid] = q.msmfg_answer ?? "";
      }
      setAnswers(init);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  function handleSelectTemplate(templateId: string) {
    void loadDetail(templateId);
    setStep("preview");
  }

  async function handleStartAnswering() {
    setStep("answering");
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    try {
      if (!detail) return;
      const res = await fetch(`/api/questionnaires/${detail.msmfg_vendorquestionnaireid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([qId, answer]) => ({
            questionnaireQuestionId: qId,
            answer,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save answers.");
      addToast("Answers saved as draft", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (!detail) return;
      const res = await fetch(`/api/questionnaires/${detail.msmfg_vendorquestionnaireid}`, {
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
      if (!res.ok) throw new Error("Failed to submit questionnaire.");
      addToast("Questionnaire submitted successfully!", "success");
      onComplete?.(detail.msmfg_vendorquestionnaireid);
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const [saving, setSaving] = useState(false);

  // Step 1: Select Template
  if (step === "select-template") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55">
        <Card className="w-full max-w-2xl mx-4 p-8 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Create New Questionnaire</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select a template to get started</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close dialog"
              title="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {loadingTemplates && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading templates…
            </div>
          )}

          {!loadingTemplates && templates.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No templates available.</p>
            </div>
          )}

          {!loadingTemplates && templates.length > 0 && (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.msmfg_questionnairetemplateid}
                  onClick={() => handleSelectTemplate(template.msmfg_questionnairetemplateid)}
                  className="w-full text-left"
                >
                  <div className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{template.msmfg_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Click to select this template</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 2: Preview template
  if (step === "preview" && detail) {
    const questionsByType = detail.questions.reduce<Record<string, typeof detail.questions>>(
      (acc, q) => {
        const type = q.msmfg_question_type ?? "General";
        acc[type] ??= [];
        acc[type].push(q);
        return acc;
      },
      {}
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55">
        <Card className="w-full max-w-3xl mx-4 p-8 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{detail.msmfg_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review the questions before you start</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close dialog"
              title="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading questionnaire…
            </div>
          ) : (
            <>
              <div className="mb-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  This questionnaire contains {detail.questions.length} question{detail.questions.length !== 1 ? "s" : ""}.
                </p>
                {Object.entries(questionsByType).map(([type, questions]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="font-medium text-foreground">{type}</h3>
                    <ul className="space-y-1 ml-4">
                      {questions.map((q) => (
                        <li key={q.msmfg_questionnairequestionid} className="text-sm text-muted-foreground">
                          • {q.msmfg_question_text ?? q.msmfg_question_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep("select-template")}
                  disabled={loadingDetail}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleStartAnswering} disabled={loadingDetail}>
                  <ChevronRight className="mr-2 h-4 w-4" /> Start Answering
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  // Step 3: Answer questions
  if (step === "answering" && detail) {
    const questionsByType = detail.questions.reduce<Record<string, typeof detail.questions>>(
      (acc, q) => {
        const type = q.msmfg_question_type ?? "General";
        acc[type] ??= [];
        acc[type].push(q);
        return acc;
      },
      {}
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55">
        <Card className="w-full max-w-3xl mx-4 p-8 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{detail.msmfg_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Answer all questions to complete</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close dialog"
              title="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 mb-8">
            {Object.entries(questionsByType).map(([type, questions]) => (
              <div key={type} className="space-y-4 border-b border-border pb-6 last:border-0">
                <h3 className="font-medium text-foreground">{type}</h3>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.msmfg_questionnairequestionid} className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {q.msmfg_question_text ?? q.msmfg_question_name}
                      </label>
                      <textarea
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={3}
                        value={answers[q.msmfg_questionnairequestionid] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.msmfg_questionnairequestionid]: e.target.value,
                          }))
                        }
                        placeholder="Enter your answer…"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("preview")}
              disabled={saving || submitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => void handleSaveAndContinue()}
                disabled={saving || submitting}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={submitting || saving}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
