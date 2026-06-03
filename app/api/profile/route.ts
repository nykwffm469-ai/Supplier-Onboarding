import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import {
  createIdentifier,
  deleteIdentifier,
  getAccountProfile,
  getIdentifiers,
  updateAccountProfile,
} from "@/lib/server/profile";

// GET /api/profile
export async function GET() {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const [profile, identifiers] = await Promise.all([
    getAccountProfile(session.accountId),
    getIdentifiers(session.accountId),
  ]);

  return NextResponse.json({ profile, identifiers });
}

// PATCH /api/profile  — update account fields
export async function PATCH(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const patch = {
    msmfg_isminorityowned: typeof body.msmfg_isminorityowned === "boolean" ? body.msmfg_isminorityowned : undefined,
    msmfg_isfemaleowned: typeof body.msmfg_isfemaleowned === "boolean" ? body.msmfg_isfemaleowned : undefined,
    msmfg_issmallbusiness: typeof body.msmfg_issmallbusiness === "boolean" ? body.msmfg_issmallbusiness : undefined,
    msmfg_islocallyowned: typeof body.msmfg_islocallyowned === "boolean" ? body.msmfg_islocallyowned : undefined,
    msmfg_isforeignownership: typeof body.msmfg_isforeignownership === "boolean" ? body.msmfg_isforeignownership : undefined,
    msmfg_employeeexpectedturnover: body.msmfg_employeeexpectedturnover != null ? Number(body.msmfg_employeeexpectedturnover) : undefined,
    msmfg_yearlyrevenuetotal: body.msmfg_yearlyrevenuetotal != null ? Number(body.msmfg_yearlyrevenuetotal) : undefined,
    msmfg_profit: body.msmfg_profit != null ? Number(body.msmfg_profit) : undefined,
    msmfg_rdinvestment: body.msmfg_rdinvestment != null ? Number(body.msmfg_rdinvestment) : undefined,
    msmfg_returnoninvestment: body.msmfg_returnoninvestment != null ? Number(body.msmfg_returnoninvestment) : undefined,
  };

  // Remove undefined keys
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  );

  await updateAccountProfile(session.accountId, cleanPatch);
  return NextResponse.json({ ok: true });
}

// POST /api/profile/identifiers — create identifier
export async function POST(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { type?: string; value?: string };
  const type = body.type?.trim() ?? "";
  const value = body.value?.trim() ?? "";

  if (!type || !value) {
    return NextResponse.json({ error: "type and value are required." }, { status: 400 });
  }

  const id = await createIdentifier(session.accountId, type, value);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}

// DELETE body handler is in [id]/route.ts
export async function DELETE(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { identifierId?: string };
  const identifierId = body.identifierId?.trim() ?? "";

  if (!identifierId) {
    return NextResponse.json({ error: "identifierId is required." }, { status: 400 });
  }

  await deleteIdentifier(session.accountId, identifierId);
  return NextResponse.json({ ok: true });
}
