import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import {
  getVendorQuestionnaireDetail,
  saveQuestionnaireAnswers,
  submitQuestionnaire,
} from "@/lib/server/questionnaires";

type Params = { params: Promise<{ id: string }> };

// GET /api/questionnaires/[id]
export async function GET(_request: NextRequest, context: Params) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const detail = await getVendorQuestionnaireDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(detail);
}

// PATCH /api/questionnaires/[id]  — save answers or submit
export async function PATCH(request: NextRequest, context: Params) {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    submit?: boolean;
    answers?: { questionnaireQuestionId: string; answer: string }[];
  };

  if (body.answers && body.answers.length > 0) {
    await saveQuestionnaireAnswers(id, body.answers);
  }

  if (body.submit) {
    await submitQuestionnaire(id);
  }

  return NextResponse.json({ ok: true });
}
