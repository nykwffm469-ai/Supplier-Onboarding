import "server-only";

import {
  createRecord,
  deleteRecord,
  getRecord,
  getRecords,
  updateRecord,
  type DataverseRecord,
} from "@/lib/server/dataverse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccountProfile = {
  accountid: string;
  name?: string;
  // Diversity flags
  msmfg_isminorityowned?: boolean;
  msmfg_isfemaleowned?: boolean;
  msmfg_issmallbusiness?: boolean;
  msmfg_islocallyowned?: boolean;
  msmfg_isforeignownership?: boolean;
  // Financials / workforce
  msmfg_employeeexpectedturnover?: number | null;
  msmfg_yearlyrevenuetotal?: number | null;
  msmfg_profit?: number | null;
  msmfg_rdinvestment?: number | null;
  msmfg_returnoninvestment?: number | null;
};

export type Identifier = {
  msmfg_identifierid: string;
  msmfg_type?: string;
  msmfg_value?: string;
};

// ---------------------------------------------------------------------------
// Demo store (activated when Dataverse env vars are absent)
// ---------------------------------------------------------------------------

declare global {
  var __supplierHubDemoProfile: Map<string, AccountProfile> | undefined;
  var __supplierHubDemoIdentifiers: Map<string, Identifier[]> | undefined;
}
globalThis.__supplierHubDemoProfile ??= new Map<string, AccountProfile>();
globalThis.__supplierHubDemoIdentifiers ??= new Map<string, Identifier[]>();

const demoProfile = globalThis.__supplierHubDemoProfile;
const demoIdentifiers = globalThis.__supplierHubDemoIdentifiers;

const DEMO_SUPPLIER_ACCOUNT_ID = "00000000-0000-0000-0000-000000000201";

if (!demoProfile.has(DEMO_SUPPLIER_ACCOUNT_ID)) {
  demoProfile.set(DEMO_SUPPLIER_ACCOUNT_ID, {
    accountid: DEMO_SUPPLIER_ACCOUNT_ID,
    name: "Taylor Supplier Manufacturing",
    msmfg_isminorityowned: true,
    msmfg_isfemaleowned: true,
    msmfg_issmallbusiness: false,
    msmfg_islocallyowned: true,
    msmfg_isforeignownership: false,
    msmfg_employeeexpectedturnover: 124,
    msmfg_yearlyrevenuetotal: 48000000,
    msmfg_profit: 6200000,
    msmfg_rdinvestment: 2100000,
    msmfg_returnoninvestment: 13.8,
  });
}

if (!demoIdentifiers.has(DEMO_SUPPLIER_ACCOUNT_ID)) {
  demoIdentifiers.set(DEMO_SUPPLIER_ACCOUNT_ID, [
    {
      msmfg_identifierid: "demo-id-001",
      msmfg_type: "EIN",
      msmfg_value: "84-9182736",
    },
    {
      msmfg_identifierid: "demo-id-002",
      msmfg_type: "TAXID",
      msmfg_value: "TX-4471902",
    },
  ]);
}

function isDataverseConfigured(): boolean {
  return !!(
    process.env.TENANT_ID &&
    process.env.CLIENT_ID &&
    process.env.CLIENT_SECRET &&
    process.env.DATAVERSE_URL
  );
}

// ---------------------------------------------------------------------------
// Account profile
// ---------------------------------------------------------------------------

export async function getAccountProfile(accountId: string): Promise<AccountProfile | null> {
  if (!isDataverseConfigured()) {
    return (
      demoProfile.get(accountId) ?? {
        accountid: accountId,
        name: "Demo Company",
        msmfg_isminorityowned: false,
        msmfg_isfemaleowned: false,
        msmfg_issmallbusiness: false,
        msmfg_islocallyowned: false,
        msmfg_isforeignownership: false,
        msmfg_employeeexpectedturnover: null,
        msmfg_yearlyrevenuetotal: null,
        msmfg_profit: null,
        msmfg_rdinvestment: null,
        msmfg_returnoninvestment: null,
      }
    );
  }

  return getRecord<AccountProfile>("accounts", accountId);
}

export async function updateAccountProfile(
  accountId: string,
  patch: Omit<AccountProfile, "accountid">
): Promise<void> {
  if (!isDataverseConfigured()) {
    const existing = demoProfile.get(accountId) ?? { accountid: accountId };
    demoProfile.set(accountId, { ...existing, ...patch });
    return;
  }

  await updateRecord("accounts", accountId, patch as DataverseRecord);
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

export async function getIdentifiers(accountId: string): Promise<Identifier[]> {
  if (!isDataverseConfigured()) {
    return demoIdentifiers.get(accountId) ?? [];
  }

  const escaped = accountId.replace(/'/g, "''");
  return getRecords<Identifier>(
    "msmfg_identifiers",
    `$select=msmfg_identifierid,msmfg_type,msmfg_value&$filter=_msmfg_account_value eq '${escaped}'&$orderby=msmfg_type asc`
  );
}

export async function createIdentifier(
  accountId: string,
  type: string,
  value: string
): Promise<string> {
  if (!isDataverseConfigured()) {
    const id = crypto.randomUUID();
    const list = demoIdentifiers.get(accountId) ?? [];
    list.push({ msmfg_identifierid: id, msmfg_type: type, msmfg_value: value });
    demoIdentifiers.set(accountId, list);
    return id;
  }

  const created = await createRecord("msmfg_identifiers", {
    msmfg_type: type,
    msmfg_value: value,
    "msmfg_account@odata.bind": `/accounts(${accountId})`,
  });

  if (!created.id) throw new Error("Could not determine created identifier ID.");
  return created.id;
}

export async function deleteIdentifier(accountId: string, identifierId: string): Promise<void> {
  if (!isDataverseConfigured()) {
    const list = (demoIdentifiers.get(accountId) ?? []).filter(
      (i) => i.msmfg_identifierid !== identifierId
    );
    demoIdentifiers.set(accountId, list);
    return;
  }

  await deleteRecord("msmfg_identifiers", identifierId);
}
