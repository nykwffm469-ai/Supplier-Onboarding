"use client";

import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { CapabilityType, VendorCapability } from "@/lib/server/capabilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/lib/use-toast";

type Data = {
  types: CapabilityType[];
  capabilities: VendorCapability[];
};

export function CapabilitiesManager() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/capabilities");
      if (!res.ok) throw new Error("Failed to load capabilities.");
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

  // Available types = types not already added
  const availableTypes = (data?.types ?? []).filter(
    (t) => !(data?.capabilities ?? []).some((c) => c.capabilityTypeId === t.msmfg_capabilitytypeid)
  );

  async function handleAdd() {
    if (!selectedType) return;
    setAdding(true);
    try {
      const res = await fetch("/api/capabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilityTypeId: selectedType }),
      });
      if (!res.ok) throw new Error("Failed to add capability.");
      const json = (await res.json()) as { id: string };
      const typeObj = data?.types.find((t) => t.msmfg_capabilitytypeid === selectedType);
      setData((prev) =>
        prev
          ? {
              ...prev,
              capabilities: [
                ...prev.capabilities,
                { msmfg_vendorcapabilityid: json.id, msmfg_capabilitytype_name: typeObj?.msmfg_name, capabilityTypeId: selectedType },
              ],
            }
          : prev
      );
      setSelectedType("");
      addToast("Capability added.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(capId: string) {
    try {
      const res = await fetch("/api/capabilities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilityId: capId }),
      });
      if (!res.ok) throw new Error("Failed to remove capability.");
      setData((prev) =>
        prev
          ? { ...prev, capabilities: prev.capabilities.filter((c) => c.msmfg_vendorcapabilityid !== capId) }
          : prev
      );
      addToast("Capability removed.", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <Toaster toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className="text-xl font-semibold text-foreground">Capabilities</h1>
        <p className="text-sm text-muted-foreground">Select the manufacturing and service capabilities your company offers.</p>
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
            <h2 className="mb-4 text-sm font-semibold text-foreground">Add Capability</h2>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-10 min-w-48 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground"
                disabled={availableTypes.length === 0}
                aria-label="Capability type"
                title="Capability type"
              >
                <option value="">— Select capability type —</option>
                {availableTypes.map((t) => (
                  <option key={t.msmfg_capabilitytypeid} value={t.msmfg_capabilitytypeid}>
                    {t.msmfg_name}
                  </option>
                ))}
              </select>
              <Button onClick={() => void handleAdd()} disabled={adding || !selectedType}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </Card>

          {data.capabilities.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No capabilities added yet.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.capabilities.map((cap, index) => (
                <Card key={cap.msmfg_vendorcapabilityid} className="flex items-center justify-between p-4 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: `${index * 35}ms` }}>
                  <span className="text-sm font-medium text-foreground">{cap.msmfg_capabilitytype_name ?? "Capability"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleRemove(cap.msmfg_vendorcapabilityid)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
