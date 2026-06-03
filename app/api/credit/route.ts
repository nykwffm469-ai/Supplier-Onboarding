import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { addCreditRating, getCreditRatings } from "@/lib/server/credit";

export async function GET() {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const ratings = await getCreditRatings(session.accountId);
  return NextResponse.json({ ratings });
}

export async function POST(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only reviewers can add ratings
  if (session.role !== "reviewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    agency?: string;
    rating?: string | null;
    score?: number | null;
    ratingDate?: string | null;
    notes?: string | null;
    // reviewers can target a different account
    accountId?: string;
  };

  const targetAccountId = body.accountId ?? session.accountId;

  if (!body.agency) {
    return NextResponse.json({ error: "agency is required." }, { status: 400 });
  }

  const id = await addCreditRating(
    targetAccountId,
    body.agency,
    body.rating ?? null,
    body.score ?? null,
    body.ratingDate ?? null,
    body.notes ?? null
  );

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
