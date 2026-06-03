"use client";

import { AlertCircle, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { CertificationType, VendorCertification } from "@/lib/server/capabilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/lib/use-toast";

type Data = {
  types: CertificationType[];
  certifications: VendorCertification[];
};

export function CertificationsManager() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/certifications");
      if (!res.ok) throw new Error("Failed to load certifications.");
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

  async function handleAdd() {
    if (!selectedType) return;
    setAdding(true);
    try {
      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificationTypeId: selectedType,
          expiryDate: expiryDate || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add certification.");
      const json = (await res.json()) as { id: string };
      const typeObj = data?.types.find((t) => t.msmfg_certificationtypeid === selectedType);
      setData((prev) =>
        prev
          ? {
              ...prev,
              certifications: [
                ...prev.certifications,
                {
                  msmfg_vendorcertificationid: json.id,
                  msmfg_certificationtype_name: typeObj?.msmfg_name,
                  certificationTypeId: selectedType,
                  msmfg_expirydate: expiryDate || null,
                  msmfg_notes: notes || null,
                },
              ],
            }
          : prev
      );
      setSelectedType("");
      setExpiryDate("");
      setNotes("");
      addToast("Certification added.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(certId: string) {
    try {
      const res = await fetch("/api/certifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificationId: certId }),
      });
      if (!res.ok) throw new Error("Failed to remove certification.");
      setData((prev) =>
        prev
          ? { ...prev, certifications: prev.certifications.filter((c) => c.msmfg_vendorcertificationid !== certId) }
          : prev
      );
      addToast("Certification removed.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    }
  }

  function isExpiringSoon(date: string | null | undefined): boolean {
    if (!date) return false;
    const expiry = new Date(date);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 90;
  }

  return (
    <div className="space-y-6">
      <Toaster toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-xl font-semibold text-foreground">Certifications</h1>
        <p className="text-sm text-muted-foreground">Upload and track your compliance certifications and quality credentials.</p>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      {!loading && data && (
        <>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Add Certification</h2>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-48 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Certification type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
                  aria-label="Certification type"
                  title="Certification type"
                >
                  <option value="">— Select type —</option>
                  {data.types.map((t) => (
                    <option key={t.msmfg_certificationtypeid} value={t.msmfg_certificationtypeid}>
                      {t.msmfg_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Expiry date</label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-40" />
              </div>
              <div className="flex-1 min-w-48 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className="flex items-end">
                <Button onClick={() => void handleAdd()} disabled={adding || !selectedType}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {data.certifications.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No certifications added yet.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.certifications.map((cert) => {
                const expiring = isExpiringSoon(cert.msmfg_expirydate);
                return (
                  <Card key={cert.msmfg_vendorcertificationid} className="space-y-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{cert.msmfg_certificationtype_name ?? "Certification"}</p>
                        {cert.msmfg_notes && <p className="mt-0.5 text-xs text-muted-foreground">{cert.msmfg_notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleRemove(cert.msmfg_vendorcertificationid)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                    {cert.msmfg_expirydate && (
                      <div className={`flex items-center gap-1 text-xs ${expiring ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                        <CalendarDays className="h-3 w-3" />
                        Expires: {new Date(cert.msmfg_expirydate).toLocaleDateString()}
                        {expiring && <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Expiring soon</span>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
