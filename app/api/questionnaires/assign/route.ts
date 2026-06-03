import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { assignQuestionnaire } from "@/lib/server/questionnaires";

// POST /api/questionnaires/assign — reviewer assigns a template to an account
export async function POST(request: NextRequest) {
  const session = await getDemoSession();
  if (!session || session.role !== "reviewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    templateId?: string;
    accountId?: string;
    contactId?: string;
  };

  if (!body.templateId || !body.accountId || !body.contactId) {
    return NextResponse.json({ error: "templateId, accountId, and contactId are required." }, { status: 400 });
  }

  const vqId = await assignQuestionnaire(body.templateId, body.accountId, body.contactId);
  return NextResponse.json({ ok: true, questionnaireId: vqId }, { status: 201 });
}
