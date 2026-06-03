"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestTypeOptions, type RequestType } from "@/lib/access-request";
import type { PendingAccessRequest } from "@/lib/server/access-request";

type DecidingState = Record<string, "approving" | "rejecting" | undefined>;

type ApiError = { error?: string };

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RequestsTable() {
  const [rows, setRows] = useState<PendingAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<DecidingState>({});
  const [decideError, setDecideError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RequestType | "All">("All");
  const [refreshTick, setRefreshTick] = useState(0);

  const loadRequests = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/admin/requests", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as
          | { value: PendingAccessRequest[] }
          | ApiError;

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error ? payload.error : "Failed to load requests."
          );
        }

        setRows("value" in payload ? payload.value : []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unknown load error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "All" && row.requestType !== typeFilter) {
        return false;
      }

      if (term) {
        return (
          row.requesterName.toLowerCase().includes(term) ||
          row.requesterEmail.toLowerCase().includes(term) ||
          row.companyName.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [rows, search, typeFilter]);

  async function decide(
    requestId: string,
    contactId: string | null,
    decision: "Approved" | "Rejected"
  ) {
    setDecideError(null);
    setDeciding((prev) => ({
      ...prev,
      [requestId]: decision === "Approved" ? "approving" : "rejecting",
    }));

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, contactId }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | { ok: boolean }
        | ApiError;

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error ? payload.error : "Failed to apply decision."
        );
      }

      // Remove approved/rejected row from the pending list
      setRows((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (error) {
      setDecideError(error instanceof Error ? error.message : "Unknown decision error");
    } finally {
      setDeciding((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search name, email, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="flex h-10 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as RequestType | "All")}
          aria-label="Filter by request type"
          title="Filter by request type"
        >
          <option value="All">All request types</option>
          {requestTypeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <Button variant="outline" onClick={() => void loadRequests()}>
          Refresh
        </Button>

        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} pending
        </span>
      </div>

      {/* Errors */}
      {(loadError ?? decideError) ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {loadError ?? decideError}
        </p>
      ) : null}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pending requests…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/40 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No pending requests match your filters.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Adjust the search or filter, or check back later.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Request type</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-card">
              {filtered.map((row) => {
                const isBusy = Boolean(deciding[row.requestId]);

                return (
                  <tr key={row.requestId} className="transition-colors hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{row.requesterName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.requesterEmail || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.companyName || "—"}</td>
                    <td className="px-4 py-3">
                      {row.requestType ? (
                        <Badge>{row.requestType}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.role ? (
                        <Badge>{row.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(row.createdOn)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => void decide(row.requestId, row.contactId, "Approved")}
                        >
                          {deciding[row.requestId] === "approving" ? "Approving…" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => void decide(row.requestId, row.contactId, "Rejected")}
                        >
                          {deciding[row.requestId] === "rejecting" ? "Rejecting…" : "Reject"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
