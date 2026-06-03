import "server-only";

import {
  createRecord,
  deleteRecord,
  getRecords,
  type DataverseRecord,
} from "@/lib/server/dataverse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CapabilityType = {
  msmfg_capabilitytypeid: string;
  msmfg_name?: string;
};

export type VendorCapability = {
  msmfg_vendorcapabilityid: string;
  msmfg_capabilitytype_name?: string;
  capabilityTypeId?: string;
};

export type CertificationType = {
  msmfg_certificationtypeid: string;
  msmfg_name?: string;
};

export type VendorCertification = {
  msmfg_vendorcertificationid: string;
  msmfg_certificationtype_name?: string;
  certificationTypeId?: string;
  msmfg_expirydate?: string | null;
  msmfg_notes?: string | null;
};

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------

declare global {
  var __supplierHubDemoCapTypes: CapabilityType[] | undefined;
  var __supplierHubDemoCertTypes: CertificationType[] | undefined;
  var __supplierHubDemoCaps: Map<string, VendorCapability[]> | undefined;
  var __supplierHubDemoCerts: Map<string, VendorCertification[]> | undefined;
}

const SEED_CAP_TYPES: CapabilityType[] = [
  { msmfg_capabilitytypeid: "ct-001", msmfg_name: "Electronics Manufacturing" },
  { msmfg_capabilitytypeid: "ct-002", msmfg_name: "Precision Machining" },
  { msmfg_capabilitytypeid: "ct-003", msmfg_name: "Injection Molding" },
  { msmfg_capabilitytypeid: "ct-004", msmfg_name: "Sheet Metal Fabrication" },
  { msmfg_capabilitytypeid: "ct-005", msmfg_name: "Logistics & Warehousing" },
];

const SEED_CERT_TYPES: CertificationType[] = [
  { msmfg_certificationtypeid: "crt-001", msmfg_name: "ISO 9001" },
  { msmfg_certificationtypeid: "crt-002", msmfg_name: "ISO 14001" },
  { msmfg_certificationtypeid: "crt-003", msmfg_name: "AS9100" },
  { msmfg_certificationtypeid: "crt-004", msmfg_name: "IATF 16949" },
  { msmfg_certificationtypeid: "crt-005", msmfg_name: "CMMC Level 2" },
];

globalThis.__supplierHubDemoCapTypes ??= SEED_CAP_TYPES;
globalThis.__supplierHubDemoCertTypes ??= SEED_CERT_TYPES;
globalThis.__supplierHubDemoCaps ??= new Map();
globalThis.__supplierHubDemoCerts ??= new Map();

const demoCapTypes = globalThis.__supplierHubDemoCapTypes;
const demoCertTypes = globalThis.__supplierHubDemoCertTypes;
const demoCaps = globalThis.__supplierHubDemoCaps;
const demoCerts = globalThis.__supplierHubDemoCerts;

const DEMO_SUPPLIER_ACCOUNT_ID = "00000000-0000-0000-0000-000000000201";

if (!demoCaps.has(DEMO_SUPPLIER_ACCOUNT_ID)) {
  demoCaps.set(DEMO_SUPPLIER_ACCOUNT_ID, [
    {
      msmfg_vendorcapabilityid: "demo-cap-001",
      msmfg_capabilitytype_name: "Electronics Manufacturing",
      capabilityTypeId: "ct-001",
    },
    {
      msmfg_vendorcapabilityid: "demo-cap-002",
      msmfg_capabilitytype_name: "Precision Machining",
      capabilityTypeId: "ct-002",
    },
    {
      msmfg_vendorcapabilityid: "demo-cap-003",
      msmfg_capabilitytype_name: "Logistics & Warehousing",
      capabilityTypeId: "ct-005",
    },
  ]);
}

if (!demoCerts.has(DEMO_SUPPLIER_ACCOUNT_ID)) {
  demoCerts.set(DEMO_SUPPLIER_ACCOUNT_ID, [
    {
      msmfg_vendorcertificationid: "demo-cert-001",
      msmfg_certificationtype_name: "ISO 9001",
      certificationTypeId: "crt-001",
      msmfg_expirydate: "2027-02-15",
      msmfg_notes: "Certified across all North America production lines.",
    },
    {
      msmfg_vendorcertificationid: "demo-cert-002",
      msmfg_certificationtype_name: "ISO 14001",
      certificationTypeId: "crt-002",
      msmfg_expirydate: "2026-08-12",
      msmfg_notes: "Renewal audit scheduled for Q3.",
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
// Capability types (reference)
// ---------------------------------------------------------------------------

export async function getCapabilityTypes(): Promise<CapabilityType[]> {
  if (!isDataverseConfigured()) return demoCapTypes;
  return getRecords<CapabilityType>(
    "msmfg_capabilitytype",
    "$select=msmfg_capabilitytypeid,msmfg_name&$orderby=msmfg_name asc"
  );
}

// ---------------------------------------------------------------------------
// Vendor capabilities
// ---------------------------------------------------------------------------

export async function getVendorCapabilities(accountId: string): Promise<VendorCapability[]> {
  if (!isDataverseConfigured()) {
    return demoCaps.get(accountId) ?? [];
  }

  const escaped = accountId.replace(/'/g, "''");
  const rows = await getRecords<DataverseRecord>(
    "msmfg_vendorcapability",
    `$select=msmfg_vendorcapabilityid&$expand=msmfg_capabilitytype($select=msmfg_capabilitytypeid,msmfg_name)&$filter=_msmfg_account_value eq '${escaped}'`
  );

  return rows.map((r) => {
    const ct = (r.msmfg_capabilitytype ?? {}) as Record<string, unknown>;
    return {
      msmfg_vendorcapabilityid: r.msmfg_vendorcapabilityid as string,
      msmfg_capabilitytype_name: ct.msmfg_name as string | undefined,
      capabilityTypeId: ct.msmfg_capabilitytypeid as string | undefined,
    };
  });
}

export async function addVendorCapability(
  accountId: string,
  capabilityTypeId: string
): Promise<string> {
  if (!isDataverseConfigured()) {
    const capType = demoCapTypes.find((c) => c.msmfg_capabilitytypeid === capabilityTypeId);
    const id = crypto.randomUUID();
    const list = demoCaps.get(accountId) ?? [];
    list.push({
      msmfg_vendorcapabilityid: id,
      msmfg_capabilitytype_name: capType?.msmfg_name,
      capabilityTypeId,
    });
    demoCaps.set(accountId, list);
    return id;
  }

  const created = await createRecord("msmfg_vendorcapability", {
    "msmfg_account@odata.bind": `/accounts(${accountId})`,
    "msmfg_capabilitytype@odata.bind": `/msmfg_capabilitytype(${capabilityTypeId})`,
  });
  if (!created.id) throw new Error("Could not create vendor capability.");
  return created.id;
}

export async function removeVendorCapability(
  accountId: string,
  capabilityId: string
): Promise<void> {
  if (!isDataverseConfigured()) {
    const list = (demoCaps.get(accountId) ?? []).filter(
      (c) => c.msmfg_vendorcapabilityid !== capabilityId
    );
    demoCaps.set(accountId, list);
    return;
  }
  await deleteRecord("msmfg_vendorcapability", capabilityId);
}

// ---------------------------------------------------------------------------
// Certification types (reference)
// ---------------------------------------------------------------------------

export async function getCertificationTypes(): Promise<CertificationType[]> {
  if (!isDataverseConfigured()) return demoCertTypes;
  return getRecords<CertificationType>(
    "msmfg_certificationtype",
    "$select=msmfg_certificationtypeid,msmfg_name&$orderby=msmfg_name asc"
  );
}

// ---------------------------------------------------------------------------
// Vendor certifications
// ---------------------------------------------------------------------------

export async function getVendorCertifications(accountId: string): Promise<VendorCertification[]> {
  if (!isDataverseConfigured()) {
    return demoCerts.get(accountId) ?? [];
  }

  const escaped = accountId.replace(/'/g, "''");
  const rows = await getRecords<DataverseRecord>(
    "msmfg_vendorcertification",
    `$select=msmfg_vendorcertificationid,msmfg_expirydate,msmfg_notes&$expand=msmfg_certificationtype($select=msmfg_certificationtypeid,msmfg_name)&$filter=_msmfg_account_value eq '${escaped}'`
  );

  return rows.map((r) => {
    const ct = (r.msmfg_certificationtype ?? {}) as Record<string, unknown>;
    return {
      msmfg_vendorcertificationid: r.msmfg_vendorcertificationid as string,
      msmfg_certificationtype_name: ct.msmfg_name as string | undefined,
      certificationTypeId: ct.msmfg_certificationtypeid as string | undefined,
      msmfg_expirydate: (r.msmfg_expirydate as string | null) ?? null,
      msmfg_notes: (r.msmfg_notes as string | null) ?? null,
    };
  });
}

export async function addVendorCertification(
  accountId: string,
  certificationTypeId: string,
  expiryDate: string | null,
  notes: string | null
): Promise<string> {
  if (!isDataverseConfigured()) {
    const certType = demoCertTypes.find((c) => c.msmfg_certificationtypeid === certificationTypeId);
    const id = crypto.randomUUID();
    const list = demoCerts.get(accountId) ?? [];
    list.push({
      msmfg_vendorcertificationid: id,
      msmfg_certificationtype_name: certType?.msmfg_name,
      certificationTypeId,
      msmfg_expirydate: expiryDate,
      msmfg_notes: notes,
    });
    demoCerts.set(accountId, list);
    return id;
  }

  const body: DataverseRecord = {
    "msmfg_account@odata.bind": `/accounts(${accountId})`,
    "msmfg_certificationtype@odata.bind": `/msmfg_certificationtype(${certificationTypeId})`,
  };
  if (expiryDate) body.msmfg_expirydate = expiryDate;
  if (notes) body.msmfg_notes = notes;

  const created = await createRecord("msmfg_vendorcertification", body);
  if (!created.id) throw new Error("Could not create vendor certification.");
  return created.id;
}

export async function removeVendorCertification(
  accountId: string,
  certificationId: string
): Promise<void> {
  if (!isDataverseConfigured()) {
    const list = (demoCerts.get(accountId) ?? []).filter(
      (c) => c.msmfg_vendorcertificationid !== certificationId
    );
    demoCerts.set(accountId, list);
    return;
  }
  await deleteRecord("msmfg_vendorcertification", certificationId);
}
