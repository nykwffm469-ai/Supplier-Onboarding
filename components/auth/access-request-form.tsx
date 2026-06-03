"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  requestTypeOptions,
  roleOptions,
  type RequestDecision,
  type RequestRole,
  type RequestType,
} from "@/lib/access-request";

type SubmissionState = "idle" | "submitting" | "submitted" | "error";

type StatusResponse = {
  decision: RequestDecision;
};

function decisionClass(decision: RequestDecision): string {
  if (decision === "Approved") {
    return "text-emerald-700";
  }

  if (decision === "Rejected") {
    return "text-rose-700";
  }

  return "text-amber-700";
}

export function AccessRequestForm() {
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("Initial Access");
  const [role, setRole] = useState<RequestRole>("Supplier");

  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [decision, setDecision] = useState<RequestDecision>("Pending");

  const isSubmitting = submissionState === "submitting";

  const trackerSteps = useMemo(
    () => [
      { key: "Pending", label: "Pending", active: true },
      {
        key: "Approved",
        label: decision === "Rejected" ? "Rejected" : "Approved",
        active: decision !== "Pending",
      },
    ],
    [decision]
  );

  async function refreshStatus(currentRequestId: string) {
    const response = await fetch(`/api/access-request/${currentRequestId}`, {
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as
      | StatusResponse
      | { error?: string };

    if (!response.ok) {
      throw new Error(
        "error" in payload && payload.error ? payload.error : "Unable to load request status."
      );
    }

    if (!("decision" in payload)) {
      throw new Error("Status response did not include a decision.");
    }

    setDecision(payload.decision);
  }

  useEffect(() => {
    if (!requestId || decision !== "Pending") {
      return;
    }

    const interval = setInterval(() => {
      void refreshStatus(requestId).catch(() => {
        // Keep prior status when transient checks fail.
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [requestId, decision]);

  async function applyDemoDecision(verdict: "Approved" | "Rejected") {
    if (!requestId) {
      return;
    }

    setErrorMessage(null);

    try {
      const response = await fetch(`/api/access-request/${requestId}/demo-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: verdict }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | { decision: RequestDecision }
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Unable to apply demo decision."
        );
      }

      await refreshStatus(requestId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown demo decision error");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionState("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterName,
          requesterEmail,
          requestType,
          role,
          companyName,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | { requestId: string; decision: RequestDecision }
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Unable to submit access request."
        );
      }

      if (!("requestId" in payload) || !("decision" in payload)) {
        throw new Error("Create request response was missing expected fields.");
      }

      setRequestId(payload.requestId);
      setDecision(payload.decision);
      setSubmissionState("submitted");
      await refreshStatus(payload.requestId);
    } catch (error) {
      setSubmissionState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown submission error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Self-Registration</CardTitle>
          <CardDescription>
            Submit your access request. We will create and track it in Dataverse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Requester name</p>
              <Input
                value={requesterName}
                onChange={(event) => setRequesterName(event.target.value)}
                placeholder="Alex Supplier"
                required
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Requester email</p>
              <Input
                type="email"
                value={requesterEmail}
                onChange={(event) => setRequesterEmail(event.target.value)}
                placeholder="alex.supplier@contoso.com"
                required
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Company name</p>
              <Input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Contoso Manufacturing"
                required
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Request type</p>
              <select
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={requestType}
                onChange={(event) => setRequestType(event.target.value as RequestType)}
                aria-label="Request type"
                title="Request type"
              >
                {requestTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Role</p>
              <select
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={role}
                onChange={(event) => setRole(event.target.value as RequestRole)}
                aria-label="Role"
                title="Role"
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting request..." : "Submit Access Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Status</CardTitle>
          <CardDescription>
            Pending requests auto-refresh every 15 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestId ? (
            <>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Request submitted successfully. Your request ID is
                <span className="ml-1 font-mono text-xs text-slate-800">{requestId}</span>.
              </div>

              <div className="flex items-center gap-3 text-sm">
                {trackerSteps.map((step, index) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`rounded-full border px-3 py-1 ${
                        step.active
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {step.label}
                    </div>
                    {index < trackerSteps.length - 1 ? (
                      <span className="text-slate-300">{"->"}</span>
                    ) : null}
                  </div>
                ))}
              </div>

              <p className={`text-sm font-medium ${decisionClass(decision)}`}>
                Current decision: {decision}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!requestId) {
                      return;
                    }

                    void refreshStatus(requestId).catch((error: unknown) => {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to refresh request status."
                      );
                    });
                  }}
                >
                  Refresh Status
                </Button>

                {decision === "Pending" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        void applyDemoDecision("Approved");
                      }}
                    >
                      Demo: Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        void applyDemoDecision("Rejected");
                      }}
                    >
                      Demo: Reject
                    </Button>
                  </>
                ) : null}
              </div>

              <p className="text-xs text-slate-400">
                Demo buttons write directly to Dataverse to simulate a reviewer decision.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Submit the form to receive confirmation and start tracking status.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
