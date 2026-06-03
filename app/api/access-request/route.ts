import { NextResponse, type NextRequest } from "next/server";

import {
  requestTypeOptions,
  roleOptions,
  type RequestRole,
  type RequestType,
} from "@/lib/access-request";
import { createAccessRequest } from "@/lib/server/access-request";

type CreateRequestBody = {
  requesterName?: string;
  requesterEmail?: string;
  requestType?: RequestType;
  role?: RequestRole;
  companyName?: string;
};

function isValidRequestType(value: unknown): value is RequestType {
  return typeof value === "string" && requestTypeOptions.includes(value as RequestType);
}

function isValidRole(value: unknown): value is RequestRole {
  return typeof value === "string" && roleOptions.includes(value as RequestRole);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CreateRequestBody;

  const requesterName = body.requesterName?.trim() ?? "";
  const requesterEmail = body.requesterEmail?.trim().toLowerCase() ?? "";
  const companyName = body.companyName?.trim() ?? "";

  if (!requesterName) {
    return NextResponse.json({ error: "Requester name is required." }, { status: 400 });
  }

  if (!requesterEmail || !/^\S+@\S+\.\S+$/.test(requesterEmail)) {
    return NextResponse.json({ error: "A valid requester email is required." }, { status: 400 });
  }

  if (!companyName) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  if (!isValidRequestType(body.requestType)) {
    return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
  }

  if (!isValidRole(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  try {
    const created = await createAccessRequest({
      requesterName,
      requesterEmail,
      requestType: body.requestType,
      role: body.role,
      companyName,
    });

    return NextResponse.json(
      {
        ok: true,
        requestId: created.requestId,
        decision: created.decision,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown create request error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
