import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import {
  addVendorCertification,
  getCertificationTypes,
  getVendorCertifications,
  removeVendorCertification,
} from "@/lib/server/capabilities";

export async function GET() {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const [types, certifications] = await Promise.all([
    getCertificationTypes(),
    getVendorCertifications(session.accountId),
  ]);

  return NextResponse.json({ types, certifications });
}

export async function POST(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    certificationTypeId?: string;
    expiryDate?: string | null;
    notes?: string | null;
  };

  if (!body.certificationTypeId) {
    return NextResponse.json({ error: "certificationTypeId is required." }, { status: 400 });
  }

  const id = await addVendorCertification(
    session.accountId,
    body.certificationTypeId,
    body.expiryDate ?? null,
    body.notes ?? null
  );
  return NextResponse.json({ ok: true, id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { certificationId?: string };
  if (!body.certificationId) {
    return NextResponse.json({ error: "certificationId is required." }, { status: 400 });
  }

  await removeVendorCertification(session.accountId, body.certificationId);
  return NextResponse.json({ ok: true });
}
