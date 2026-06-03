import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import {
  addVendorCapability,
  getCapabilityTypes,
  getVendorCapabilities,
  removeVendorCapability,
} from "@/lib/server/capabilities";

export async function GET() {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const [types, capabilities] = await Promise.all([
    getCapabilityTypes(),
    getVendorCapabilities(session.accountId),
  ]);

  return NextResponse.json({ types, capabilities });
}

export async function POST(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { capabilityTypeId?: string };
  if (!body.capabilityTypeId) {
    return NextResponse.json({ error: "capabilityTypeId is required." }, { status: 400 });
  }

  const id = await addVendorCapability(session.accountId, body.capabilityTypeId);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { capabilityId?: string };
  if (!body.capabilityId) {
    return NextResponse.json({ error: "capabilityId is required." }, { status: 400 });
  }

  await removeVendorCapability(session.accountId, body.capabilityId);
  return NextResponse.json({ ok: true });
}
