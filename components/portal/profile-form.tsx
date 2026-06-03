"use client";

import { AlertCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { AccountProfile, Identifier } from "@/lib/server/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/lib/use-toast";

// ---------------------------------------------------------------------------
// Completeness helpers
// ---------------------------------------------------------------------------

const DIVERSITY_FIELDS: (keyof AccountProfile)[] = [
  "msmfg_isminorityowned",
  "msmfg_isfemaleowned",
  "msmfg_issmallbusiness",
  "msmfg_islocallyowned",
  "msmfg_isforeignownership",
];

const FINANCIAL_FIELDS: (keyof AccountProfile)[] = [
  "msmfg_employeeexpectedturnover",
  "msmfg_yearlyrevenuetotal",
  "msmfg_profit",
  "msmfg_rdinvestment",
  "msmfg_returnoninvestment",
];

function calcCompleteness(profile: AccountProfile | null, identifiers: Identifier[]): number {
  if (!profile) return 0;
  let filled = 0;
  const total = DIVERSITY_FIELDS.length + FINANCIAL_FIELDS.length + 1; // +1 for identifiers

  for (const f of DIVERSITY_FIELDS) {
    if (profile[f] != null) filled++;
  }
  for (const f of FINANCIAL_FIELDS) {
    if (profile[f] != null && (profile[f] as number) > 0) filled++;
  }
  if (identifiers.length > 0) filled++;

  return Math.round((filled / total) * 100);
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50">
      <span className="text-sm text-foreground">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`} />
        <div
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type ProfileState = {
  profile: AccountProfile | null;
  identifiers: Identifier[];
};

export function ProfileForm() {
  const [data, setData] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  // Identifier add form
  const [newIdType, setNewIdType] = useState("EIN");
  const [newIdValue, setNewIdValue] = useState("");
  const [addingId, setAddingId] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile.");
      const json = (await res.json()) as ProfileState;
      setData(json);
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

  function setFlag(field: keyof AccountProfile, value: boolean) {
    setData((prev) =>
      prev ? { ...prev, profile: { ...prev.profile!, [field]: value } } : prev
    );
  }

  function setNumeric(field: keyof AccountProfile, raw: string) {
    const parsed = raw === "" ? null : Number(raw);
    setData((prev) =>
      prev ? { ...prev, profile: { ...prev.profile!, [field]: parsed } } : prev
    );
  }

  async function handleSave() {
    if (!data?.profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.profile),
      });
      if (!res.ok) throw new Error("Save failed.");
      addToast("Profile saved successfully.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddIdentifier() {
    if (!newIdValue.trim()) return;
    setAddingId(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newIdType, value: newIdValue }),
      });
      if (!res.ok) throw new Error("Failed to add identifier.");
      const json = (await res.json()) as { id: string };
      setData((prev) =>
        prev
          ? {
              ...prev,
              identifiers: [
                ...prev.identifiers,
                { msmfg_identifierid: json.id, msmfg_type: newIdType, msmfg_value: newIdValue },
              ],
            }
          : prev
      );
      setNewIdValue("");
      addToast("Identifier added.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    } finally {
      setAddingId(false);
    }
  }

  async function handleDeleteIdentifier(id: string) {
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifierId: id }),
      });
      if (!res.ok) throw new Error("Failed to delete identifier.");
      setData((prev) =>
        prev
          ? { ...prev, identifiers: prev.identifiers.filter((i) => i.msmfg_identifierid !== id) }
          : prev
      );
      addToast("Identifier removed.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> {error}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => void load()}>Retry</Button>
      </div>
    );
  }

  const profile = data?.profile ?? ({} as AccountProfile);
  const identifiers = data?.identifiers ?? [];
  const completeness = calcCompleteness(data?.profile ?? null, identifiers);

  return (
    <div className="space-y-6">
      <Toaster toasts={toasts} onRemove={removeToast} />

      {/* Completeness */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Profile completeness</span>
          <span className="text-sm font-semibold text-primary">{completeness}%</span>
        </div>
        <progress
          className="h-2 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
          value={completeness}
          max={100}
          aria-label="Profile completeness progress"
          title="Profile completeness progress"
        />
      </Card>

      {/* Diversity flags */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Diversity & Ownership</h2>
        <div className="space-y-3">
          {(
            [
              ["msmfg_isminorityowned", "Minority-owned business"],
              ["msmfg_isfemaleowned", "Female-owned business"],
              ["msmfg_issmallbusiness", "Small business"],
              ["msmfg_islocallyowned", "Locally-owned business"],
              ["msmfg_isforeignownership", "Foreign ownership"],
            ] as [keyof AccountProfile, string][]
          ).map(([field, label]) => (
            <ToggleRow
              key={field}
              label={label}
              checked={!!(profile[field])}
              onChange={(v) => setFlag(field, v)}
            />
          ))}
        </div>
      </Card>

      {/* Financials */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Workforce & Financials</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["msmfg_employeeexpectedturnover", "Employee Expected Turnover (headcount)"],
              ["msmfg_yearlyrevenuetotal", "Yearly Revenue Total ($)"],
              ["msmfg_profit", "Profit ($)"],
              ["msmfg_rdinvestment", "R&D Investment ($)"],
              ["msmfg_returnoninvestment", "Return on Investment (%)"],
            ] as [keyof AccountProfile, string][]
          ).map(([field, label]) => (
            <div key={field} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <Input
                type="number"
                min="0"
                value={(profile[field] as number | null | undefined) ?? ""}
                onChange={(e) => setNumeric(field, e.target.value)}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Identifiers */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Company Identifiers</h2>

        {identifiers.length > 0 ? (
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Value</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {identifiers.map((id) => (
                <tr key={id.msmfg_identifierid} className="border-b border-border/60">
                  <td className="py-2">
                    <Badge>{id.msmfg_type}</Badge>
                  </td>
                  <td className="py-2 font-mono text-foreground">{id.msmfg_value}</td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDeleteIdentifier(id.msmfg_identifierid)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">No identifiers added yet.</p>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <select
              value={newIdType}
              onChange={(e) => setNewIdType(e.target.value)}
              aria-label="Identifier type"
              title="Identifier type"
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option>EIN</option>
              <option>TAXID</option>
            </select>
          </div>
          <div className="flex-1 min-w-40 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Value</label>
            <Input
              value={newIdValue}
              onChange={(e) => setNewIdValue(e.target.value)}
              placeholder="e.g. 12-3456789"
            />
          </div>
          <Button
            onClick={() => void handleAddIdentifier()}
            disabled={addingId || !newIdValue.trim()}
            size="sm"
          >
            {addingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
