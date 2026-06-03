import type {
  RequestDecision,
  RequestRole,
  RequestType,
} from "@/lib/access-request";
import { requestTypeOptions, roleOptions } from "@/lib/access-request";
import type { DataverseRecord } from "@/lib/server/dataverse";
import { createRecord, getRecords, updateRecord } from "@/lib/server/dataverse";

export type CreateAccessRequestInput = {
  requesterName: string;
  requesterEmail: string;
  requestType: RequestType;
  role: RequestRole;
  companyName: string;
};

type AccountRow = {
  accountid?: string;
  name?: string;
};

type ContactRow = {
  contactid?: string;
  fullname?: string;
  emailaddress1?: string;
};

type AccessRequestRow = {
  msmfg_accessrequestid?: string;
  msmfg_decision?: number | null;
};

export type PendingAccessRequest = {
  requestId: string;
  requesterName: string;
  requesterEmail: string;
  companyName: string;
  requestType: RequestType | null;
  role: RequestRole | null;
  createdOn: string | null;
  contactId: string | null;
};

type ExpandedAccessRequestRow = {
  msmfg_accessrequestid?: string;
  msmfg_requesttype?: number | null;
  msmfg_role?: number | null;
  msmfg_decision?: number | null;
  createdon?: string;
  "msmfg_contact_x002e_contactid"?: string;
  "msmfg_contact_x002e_fullname"?: string;
  "msmfg_contact_x002e_emailaddress1"?: string;
  "msmfg_account_x002e_accountid"?: string;
  "msmfg_account_x002e_name"?: string;
};

// ---------------------------------------------------------------------------
// Demo mode — used when Dataverse env vars are not configured.
// Stores records in memory so the full request flow works without credentials.
// ---------------------------------------------------------------------------

type DemoRecord = {
  requestId: string;
  requesterName: string;
  requesterEmail: string;
  companyName: string;
  requestType: RequestType;
  role: RequestRole;
  decision: RequestDecision;
  createdOn: string;
  contactId: string;
};

// Survive Next.js HMR by pinning to globalThis.
declare global {
  var __supplierHubDemoStore: Map<string, DemoRecord> | undefined;
}
globalThis.__supplierHubDemoStore ??= new Map<string, DemoRecord>();
const demoStore = globalThis.__supplierHubDemoStore;

const DEMO_SEED_ACCESS_REQUESTS: DemoRecord[] = [
  {
    requestId: "demo-ar-001",
    requesterName: "Morgan Supply",
    requesterEmail: "morgan.supply@northwind.com",
    companyName: "Northwind Components",
    requestType: "Initial Access",
    role: "Supplier",
    decision: "Pending",
    createdOn: "2026-05-29T14:30:00.000Z",
    contactId: "00000000-0000-0000-0000-000000000401",
  },
  {
    requestId: "demo-ar-002",
    requesterName: "Sam Ops",
    requesterEmail: "sam.ops@adatum.com",
    companyName: "Adatum Manufacturing",
    requestType: "DEV Onboard",
    role: "Business",
    decision: "Pending",
    createdOn: "2026-05-31T09:15:00.000Z",
    contactId: "00000000-0000-0000-0000-000000000402",
  },
  {
    requestId: "demo-ar-003",
    requesterName: "Casey Quality",
    requesterEmail: "casey.quality@contoso.com",
    companyName: "Contoso Fabrication",
    requestType: "SME input",
    role: "Developer",
    decision: "Approved",
    createdOn: "2026-05-20T10:00:00.000Z",
    contactId: "00000000-0000-0000-0000-000000000403",
  },
];

for (const record of DEMO_SEED_ACCESS_REQUESTS) {
  if (!demoStore.has(record.requestId)) {
    demoStore.set(record.requestId, record);
  }
}

function isDataverseConfigured(): boolean {
  return !!(
    process.env.TENANT_ID &&
    process.env.CLIENT_ID &&
    process.env.CLIENT_SECRET &&
    process.env.DATAVERSE_URL
  );
}

type OptionMap<T extends string> = Record<T, number>;

function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}

function parseName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? name.trim(),
      lastName: "",
    };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function parseOptionMap<T extends string>(
  envName: string,
  options: readonly T[],
  fallbackBase: number
): OptionMap<T> {
  const raw = process.env[envName]?.trim();

  if (!raw) {
    return options.reduce((acc, option, index) => {
      acc[option] = fallbackBase + index;
      return acc;
    }, {} as OptionMap<T>);
  }

  const parsed = JSON.parse(raw) as Partial<Record<T, number>>;
  const result = {} as OptionMap<T>;

  for (const option of options) {
    const value = parsed[option];

    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error(
        `Missing numeric choice value for '${option}' in ${envName}.`
      );
    }

    result[option] = value;
  }

  return result;
}

const requestTypeMap = parseOptionMap<RequestType>(
  "DATAVERSE_REQUESTTYPE_VALUES",
  requestTypeOptions,
  100000000
);

const roleMap = parseOptionMap<RequestRole>(
  "DATAVERSE_ROLE_VALUES",
  roleOptions,
  100000010
);

const decisionMap = parseOptionMap<"Approved" | "Rejected">(
  "DATAVERSE_DECISION_VALUES",
  ["Approved", "Rejected"],
  100000020
);

function normalizeDecision(value: number | null | undefined): RequestDecision {
  if (value == null) {
    return "Pending";
  }

  if (value === decisionMap.Approved) {
    return "Approved";
  }

  if (value === decisionMap.Rejected) {
    return "Rejected";
  }

  return "Pending";
}

async function findOrCreateAccount(companyName: string): Promise<string> {
  const query = [
    "$select=accountid,name",
    `$filter=name eq '${escapeOData(companyName)}'`,
    "$top=1",
  ].join("&");

  const existing = await getRecords<AccountRow>("accounts", query);
  const existingId = existing[0]?.accountid;

  if (existingId) {
    return existingId;
  }

  const created = await createRecord("accounts", {
    name: companyName,
  });

  if (!created.id) {
    throw new Error("Unable to determine created account ID.");
  }

  return created.id;
}

async function findOrCreateContact(
  requesterName: string,
  requesterEmail: string,
  accountId: string
): Promise<string> {
  const query = [
    "$select=contactid,fullname,emailaddress1",
    `$filter=emailaddress1 eq '${escapeOData(requesterEmail)}'`,
    "$top=1",
  ].join("&");

  const existing = await getRecords<ContactRow>("contacts", query);
  const existingId = existing[0]?.contactid;
  const { firstName, lastName } = parseName(requesterName);

  if (existingId) {
    await updateRecord("contacts", existingId, {
      firstname: firstName,
      lastname: lastName,
      fullname: requesterName,
      "parentcustomerid_account@odata.bind": `/accounts(${accountId})`,
    });

    return existingId;
  }

  const created = await createRecord("contacts", {
    firstname: firstName,
    lastname: lastName,
    fullname: requesterName,
    emailaddress1: requesterEmail,
    "parentcustomerid_account@odata.bind": `/accounts(${accountId})`,
  });

  if (!created.id) {
    throw new Error("Unable to determine created contact ID.");
  }

  return created.id;
}

function getLookupField(logicalNameEnv: string, fallback: string): string {
  return process.env[logicalNameEnv]?.trim() || fallback;
}

export async function createAccessRequest(input: CreateAccessRequestInput): Promise<{
  requestId: string;
  decision: RequestDecision;
}> {
  if (!isDataverseConfigured()) {
    const requestId = crypto.randomUUID();
    demoStore.set(requestId, {
      requestId,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      companyName: input.companyName,
      requestType: input.requestType,
      role: input.role,
      decision: "Pending",
      createdOn: new Date().toISOString(),
      contactId: crypto.randomUUID(),
    });
    return { requestId, decision: "Pending" };
  }

  const accountId = await findOrCreateAccount(input.companyName.trim());
  const contactId = await findOrCreateContact(
    input.requesterName.trim(),
    input.requesterEmail.trim().toLowerCase(),
    accountId
  );

  const contactLookup = getLookupField(
    "DATAVERSE_ACCESSREQUEST_CONTACT_LOOKUP",
    "msmfg_contact"
  );
  const accountLookup = getLookupField(
    "DATAVERSE_ACCESSREQUEST_ACCOUNT_LOOKUP",
    "msmfg_account"
  );

  const body: DataverseRecord = {
    msmfg_name: `${input.requestType} - ${input.requesterEmail}`,
    msmfg_requesttype: requestTypeMap[input.requestType],
    msmfg_role: roleMap[input.role],
    msmfg_decision: null,
    [`${contactLookup}@odata.bind`]: `/contacts(${contactId})`,
    [`${accountLookup}@odata.bind`]: `/accounts(${accountId})`,
  };

  const created = await createRecord("msmfg_accessrequest", body);

  if (!created.id) {
    throw new Error("Unable to determine created access request ID.");
  }

  return {
    requestId: created.id,
    decision: "Pending",
  };
}

export async function getAccessRequestDecision(requestId: string): Promise<RequestDecision> {
  if (!isDataverseConfigured()) {
    const record = demoStore.get(requestId);
    if (!record) throw new Error("Access request not found.");
    return record.decision;
  }

  const query = [
    "$select=msmfg_accessrequestid,msmfg_decision",
    `$filter=msmfg_accessrequestid eq guid'${requestId}'`,
    "$top=1",
  ].join("&");

  const rows = await getRecords<AccessRequestRow>("msmfg_accessrequest", query);
  const row = rows[0];

  if (!row) {
    throw new Error("Access request not found.");
  }

  return normalizeDecision(row.msmfg_decision);
}

export async function setAccessRequestDecision(
  requestId: string,
  decision: "Approved" | "Rejected"
): Promise<void> {
  if (!isDataverseConfigured()) {
    const record = demoStore.get(requestId);
    if (record) record.decision = decision;
    return;
  }

  await updateRecord("msmfg_accessrequest", requestId, {
    msmfg_decision: decisionMap[decision],
  });
}

// Reverse maps: numeric option value -> display label
function invertMap<T extends string>(map: Record<T, number>): Map<number, T> {
  const result = new Map<number, T>();
  for (const [key, value] of Object.entries(map) as [T, number][]) {
    result.set(value, key);
  }
  return result;
}

const requestTypeByValue = invertMap(requestTypeMap);
const roleByValue = invertMap(roleMap);

export async function getPendingAccessRequests(): Promise<PendingAccessRequest[]> {
  if (!isDataverseConfigured()) {
    return Array.from(demoStore.values())
      .filter((r) => r.decision === "Pending")
      .sort((a, b) => a.createdOn.localeCompare(b.createdOn))
      .map((r) => ({
        requestId: r.requestId,
        requesterName: r.requesterName,
        requesterEmail: r.requesterEmail,
        companyName: r.companyName,
        requestType: r.requestType,
        role: r.role,
        createdOn: r.createdOn,
        contactId: r.contactId,
      }));
  }

  const contactLookup = getLookupField(
    "DATAVERSE_ACCESSREQUEST_CONTACT_LOOKUP",
    "msmfg_contact"
  );
  const accountLookup = getLookupField(
    "DATAVERSE_ACCESSREQUEST_ACCOUNT_LOOKUP",
    "msmfg_account"
  );

  const query = [
    `$select=msmfg_accessrequestid,msmfg_requesttype,msmfg_role,msmfg_decision,createdon`,
    `$expand=${contactLookup}($select=contactid,fullname,emailaddress1),${accountLookup}($select=accountid,name)`,
    `$filter=msmfg_decision eq null`,
    `$orderby=createdon asc`,
    `$top=200`,
  ].join("&");

  const rows = await getRecords<ExpandedAccessRequestRow>("msmfg_accessrequest", query);

  return rows.map((row): PendingAccessRequest => {
    const contactPrefix = `${contactLookup}_x002e_`;
    const accountPrefix = `${accountLookup}_x002e_`;
    const loose = row as Record<string, unknown>;

    return {
      requestId: (loose.msmfg_accessrequestid as string | undefined) ?? "",
      requesterName: (loose[`${contactPrefix}fullname`] as string | undefined) ?? "",
      requesterEmail: (loose[`${contactPrefix}emailaddress1`] as string | undefined) ?? "",
      companyName: (loose[`${accountPrefix}name`] as string | undefined) ?? "",
      requestType: requestTypeByValue.get((loose.msmfg_requesttype as number | undefined) ?? NaN) ?? null,
      role: roleByValue.get((loose.msmfg_role as number | undefined) ?? NaN) ?? null,
      createdOn: (loose.createdon as string | undefined) ?? null,
      contactId: (loose[`${contactPrefix}contactid`] as string | undefined) ?? null,
    };
  });
}

export async function approveAccessRequest(requestId: string, contactId: string): Promise<void> {
  if (!isDataverseConfigured()) {
    const record = demoStore.get(requestId);
    if (record) record.decision = "Approved";
    return;
  }

  // Set decision on the access request
  await updateRecord("msmfg_accessrequest", requestId, {
    msmfg_decision: decisionMap.Approved,
  });

  // Mark the linked Contact with portal access flag and supplier role
  if (contactId) {
    await updateRecord("contacts", contactId, {
      msmfg_portalaccess: true,
      msmfg_role: "Supplier",
    });
  }
}

export async function rejectAccessRequest(requestId: string): Promise<void> {
  if (!isDataverseConfigured()) {
    const record = demoStore.get(requestId);
    if (record) record.decision = "Rejected";
    return;
  }

  await updateRecord("msmfg_accessrequest", requestId, {
    msmfg_decision: decisionMap.Rejected,
  });
}
