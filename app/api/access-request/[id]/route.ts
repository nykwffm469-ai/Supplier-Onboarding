import { NextResponse, type NextRequest } from "next/server";

import { getAccessRequestDecision } from "@/lib/server/access-request";

type Params = {
  params: Promise<{ id: string }>;
};

const guidRegex = /^[0-9a-fA-F-]{36}$/;

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;

  if (!guidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }

  try {
    const decision = await getAccessRequestDecision(id);

    return NextResponse.json({
      requestId: id,
      decision,
      tracker: ["Pending", decision],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown status lookup error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
