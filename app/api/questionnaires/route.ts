import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import {
  getTemplates,
  getVendorQuestionnaires,
} from "@/lib/server/questionnaires";

// GET /api/questionnaires
// Lists account questionnaires and available templates for creating/assigning
export async function GET() {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.accountId) return NextResponse.json({ error: "No account linked." }, { status: 400 });

  const questionnaires = await getVendorQuestionnaires(session.accountId);
  const templates = await getTemplates();

  return NextResponse.json({ questionnaires, templates });
}
