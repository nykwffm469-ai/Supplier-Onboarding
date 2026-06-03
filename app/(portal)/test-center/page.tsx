"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HealthResult = {
  status?: string;
  auth?: {
    email: string | null;
    role: "supplier" | "reviewer";
    contactId: string | null;
    accountId: string | null;
  };
  dataverse?: {
    ok: boolean;
    sampleCount?: number;
    message: string;
  };
  error?: string;
};

export default function TestCenterPage() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function runHealthCheck() {
    setLoading(true);

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const payload = (await response.json()) as HealthResult;

      setHttpStatus(response.status);
      setResult(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setHttpStatus(0);
      setResult({ error: message });
    } finally {
      setLoading(false);
    }
  }

  async function resetDemoStory() {
    setResetting(true);
    setResetMessage(null);
    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to reset demo story data.");
      }

      setResetMessage("Demo story data has been reset. Refresh other pages to see baseline records.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setResetMessage(message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Test Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Run one check to validate your current login session and Dataverse connectivity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Health Check</CardTitle>
          <CardDescription>
            Calls protected endpoints for health diagnostics and demo-story reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runHealthCheck} disabled={loading || resetting}>
              {loading ? "Running..." : "Run Health Check"}
            </Button>
            <Button variant="outline" onClick={resetDemoStory} disabled={resetting || loading}>
              {resetting ? "Resetting..." : "Reset Demo Story Data"}
            </Button>
          </div>

          {resetMessage ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
              {resetMessage}
            </div>
          ) : null}

          <div className="rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">
              HTTP status: {httpStatus ?? "not run"}
            </p>
            <pre className="mt-3 overflow-auto text-xs text-muted-foreground">
              {result ? JSON.stringify(result, null, 2) : "No result yet."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
