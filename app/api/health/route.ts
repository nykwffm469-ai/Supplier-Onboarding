import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { getRecords } from "@/lib/server/dataverse";

export async function GET() {
  const session = await getDemoSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authSummary = {
    email: session.email ?? null,
    role: session.role,
    contactId: session.contactId,
    accountId: session.accountId,
  };

  try {
    const records = await getRecords<{ contactid?: string }>(
      "contacts",
      "$select=contactid&$top=1"
    );

    return NextResponse.json({
      status: "ok",
      auth: authSummary,
      dataverse: {
        ok: true,
        sampleCount: records.length,
        message: "Dataverse connection verified.",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Dataverse error";

    return NextResponse.json(
      {
        status: "degraded",
        auth: authSummary,
        dataverse: {
          ok: false,
          message,
        },
      },
      { status: 503 }
    );
  }
}
