import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { approveAccessRequest, rejectAccessRequest } from "@/lib/server/access-request";

type Params = {
  params: Promise<{ id: string }>;
};

type Body = {
  decision?: string;
  contactId?: string;
};

const guidRegex = /^[0-9a-fA-F-]{36}$/;

export async function POST(request: NextRequest, context: Params) {
  const session = await getDemoSession();

  if (!session || session.role !== "reviewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!guidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const { decision, contactId } = body;

  if (decision !== "Approved" && decision !== "Rejected") {
    return NextResponse.json(
      { error: "decision must be 'Approved' or 'Rejected'." },
      { status: 400 }
    );
  }

  try {
    if (decision === "Approved") {
      if (!contactId || !guidRegex.test(contactId)) {
        return NextResponse.json(
          { error: "contactId is required for approval." },
          { status: 400 }
        );
      }

      await approveAccessRequest(id, contactId);
    } else {
      await rejectAccessRequest(id);
    }

    return NextResponse.json({ ok: true, requestId: id, decision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown decision error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
