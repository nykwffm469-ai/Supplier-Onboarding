import { NextResponse, type NextRequest } from "next/server";

import { setAccessRequestDecision } from "@/lib/server/access-request";

type Params = {
  params: Promise<{ id: string }>;
};

type Body = {
  decision?: string;
};

const guidRegex = /^[0-9a-fA-F-]{36}$/;

/**
 * Demo-only endpoint — sets msmfg_decision on an access request record so you
 * can instantly test the Pending → Approved / Rejected tracker flow without
 * needing a reviewer to act in Dataverse.
 *
 * POST /api/access-request/{id}/demo-decision
 * Body: { "decision": "Approved" | "Rejected" }
 */
export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;

  if (!guidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const decision = body.decision;

  if (decision !== "Approved" && decision !== "Rejected") {
    return NextResponse.json(
      { error: "decision must be 'Approved' or 'Rejected'." },
      { status: 400 }
    );
  }

  try {
    await setAccessRequestDecision(id, decision);
    return NextResponse.json({ ok: true, requestId: id, decision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error setting decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
