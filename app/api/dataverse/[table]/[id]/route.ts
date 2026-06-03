import { NextResponse, type NextRequest } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { getRecord, updateRecord, type DataverseRecord } from "@/lib/server/dataverse";

type Params = {
  params: Promise<{ table: string; id: string }>;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(_request: NextRequest, context: Params) {
  const session = await getDemoSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const { table, id } = await context.params;
  const record = await getRecord<DataverseRecord>(table, id);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(request: NextRequest, context: Params) {
  const session = await getDemoSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const { table, id } = await context.params;
  const body = (await request.json()) as DataverseRecord;
  await updateRecord(table, id, body);

  return NextResponse.json({ ok: true });
}
