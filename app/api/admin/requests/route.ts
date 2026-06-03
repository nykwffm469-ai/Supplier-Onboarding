import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { getPendingAccessRequests } from "@/lib/server/access-request";

export async function GET() {
  const session = await getDemoSession();

  if (!session || session.role !== "reviewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const requests = await getPendingAccessRequests();
    return NextResponse.json({ value: requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error listing requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
