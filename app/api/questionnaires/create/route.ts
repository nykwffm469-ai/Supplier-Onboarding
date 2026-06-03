import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { assignQuestionnaire } from "@/lib/server/questionnaires";

// POST /api/questionnaires/create — supplier starts a new questionnaire from a template
export async function POST(request: NextRequest) {
  const session = await getDemoSession();
  if (!session || !session.accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    templateId?: string;
  };

  if (!body.templateId) {
    return NextResponse.json({ error: "templateId is required." }, { status: 400 });
  }

  // Use the contact ID from the session (this would be the logged-in supplier's contact)
  // For demo purposes, generate a placeholder contact ID
  const contactId = session.contactId || `contact-${session.accountId}`;

  try {
    const questionnaireId = await assignQuestionnaire(
      body.templateId,
      session.accountId,
      contactId
    );
    return NextResponse.json({ ok: true, questionnaireId }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create questionnaire" },
      { status: 500 }
    );
  }
}
