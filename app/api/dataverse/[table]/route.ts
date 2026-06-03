import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { createRecord, getRecords, type DataverseRecord } from "@/lib/server/dataverse";

type Params = {
  params: Promise<{ table: string }>;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest, context: Params) {
  const session = await getDemoSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const { table } = await context.params;
  const odataQuery = request.nextUrl.searchParams.get("q") ?? "";
  const records = await getRecords<DataverseRecord>(table, odataQuery);

  return NextResponse.json({ value: records });
}

export async function POST(request: NextRequest, context: Params) {
  const session = await getDemoSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const { table } = await context.params;
  const body = (await request.json()) as DataverseRecord;
  const created = await createRecord(table, body);

  return NextResponse.json(created, { status: 201 });
}
