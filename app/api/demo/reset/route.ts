import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { resetDemoStoryData } from "@/lib/server/demo-story-reset";

// POST /api/demo/reset
// Resets all in-memory demo data to the default story state.
export async function POST() {
  const session = await getDemoSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  resetDemoStoryData();

  return NextResponse.json({ ok: true, message: "Demo data reset to story baseline." });
}
