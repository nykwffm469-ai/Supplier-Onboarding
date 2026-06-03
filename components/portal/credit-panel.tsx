"use client";

import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { creditAgencyOptions } from "@/lib/credit";

type CreditRating = {
  msmfg_creditratingid: string;
  msmfg_agency?: string;
  msmfg_rating?: string | null;
  msmfg_score?: number | null;
  msmfg_ratingdate?: string | null;
  msmfg_notes?: string | null;
};
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/lib/use-toast";

const agencyColors: Record<string, string> = {
  Experion: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/45 dark:bg-violet-950/25 dark:text-violet-300",
  TransUnion: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/45 dark:bg-blue-950/25 dark:text-blue-300",
  BBB: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/45 dark:bg-emerald-950/25 dark:text-emerald-300",
};

type CreditPanelProps = { role: string };

export function CreditPanel({ role }: CreditPanelProps) {
  const [ratings, setRatings] = useState<CreditRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [agency, setAgency] = useState("Experion");
  const [rating, setRating] = useState("");
  const [score, setScore] = useState("");
  const [ratingDate, setRatingDate] = useState("");
  const [notes, setNotes] = useState("");

  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credit");
      if (!res.ok) throw new Error("Failed to load credit ratings.");
      const json = (await res.json()) as { ratings: CreditRating[] };
      setRatings(json.ratings);
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

  async function handleAdd() {
    setAdding(true);
    try {
      const res = await fetch("/api/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency,
          rating: rating || null,
          score: score ? Number(score) : null,
          ratingDate: ratingDate || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add rating.");
      const json = (await res.json()) as { id: string };
      setRatings((prev) => [
        {
          msmfg_creditratingid: json.id,
          msmfg_agency: agency,
          msmfg_rating: rating || null,
          msmfg_score: score ? Number(score) : null,
          msmfg_ratingdate: ratingDate || null,
          msmfg_notes: notes || null,
        },
        ...prev,
      ]);
      setAgency("Experion");
      setRating("");
      setScore("");
      setRatingDate("");
      setNotes("");
      setShowForm(false);
      addToast("Credit rating added.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    } finally {
      setAdding(false);
    }
  }

  // Group by agency
  const byAgency = ratings.reduce<Record<string, CreditRating[]>>((acc, r) => {
    const a = r.msmfg_agency ?? "Other";
    acc[a] ??= [];
    acc[a].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Toaster toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Credit Ratings</h1>
          <p className="text-sm text-muted-foreground">
            {role === "reviewer"
              ? "Add and review credit ratings for this supplier."
              : "Your company's credit ratings by agency."}
          </p>
        </div>
        {role === "reviewer" && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Add Rating
          </Button>
        )}
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      {role === "reviewer" && showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">New Credit Rating</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Agency</label>
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                aria-label="Credit agency"
                title="Credit agency"
              >
                {creditAgencyOptions.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rating (e.g. A+)</label>
              <Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="A+" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Score</label>
              <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="750" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rating date</label>
              <Input type="date" value={ratingDate} onChange={(e) => setRatingDate(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void handleAdd()} disabled={adding}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </Card>
      )}

      {!loading && ratings.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No credit ratings on file.</p>
        </Card>
      )}

      {!loading && ratings.length > 0 && (
        <div className="space-y-4">
          {(Object.entries(byAgency) as [string, CreditRating[]][]).map(([agencyName, agencyRatings]) => (
            <Card key={agencyName} className="overflow-hidden">
              <div className={`flex items-center gap-2 border-b border-border px-5 py-3 ${agencyColors[agencyName] ?? "bg-muted text-foreground"}`}>
                <Badge className={agencyColors[agencyName] ?? ""}>{agencyName}</Badge>
                <span className="text-sm font-medium">{agencyName}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70">
                    <th className="px-5 py-2 text-left text-xs font-medium text-muted-foreground">Rating</th>
                    <th className="px-5 py-2 text-left text-xs font-medium text-muted-foreground">Score</th>
                    <th className="px-5 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-5 py-2 text-left text-xs font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyRatings.map((r) => (
                    <tr key={r.msmfg_creditratingid} className="border-b border-border/40 last:border-0">
                      <td className="px-5 py-3 font-semibold text-foreground">{r.msmfg_rating ?? "—"}</td>
                      <td className="px-5 py-3 text-foreground">{r.msmfg_score ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {r.msmfg_ratingdate ? new Date(r.msmfg_ratingdate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{r.msmfg_notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
