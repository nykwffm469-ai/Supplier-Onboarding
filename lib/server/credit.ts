import "server-only";

import { createRecord, getRecords, type DataverseRecord } from "@/lib/server/dataverse";
import type { CreditAgency } from "@/lib/credit";

export type { CreditAgency };
export { creditAgencyOptions } from "@/lib/credit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreditRating = {
  msmfg_creditratingid: string;
  msmfg_agency?: string;
  msmfg_rating?: string | null;
  msmfg_score?: number | null;
  msmfg_ratingdate?: string | null;
  msmfg_notes?: string | null;
};

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------

declare global {
  var __supplierHubDemoCreditRatings: Map<string, CreditRating[]> | undefined;
}
globalThis.__supplierHubDemoCreditRatings ??= new Map();
const demoCreditRatings = globalThis.__supplierHubDemoCreditRatings;

const DEMO_SUPPLIER_ACCOUNT_ID = "00000000-0000-0000-0000-000000000201";

if (!demoCreditRatings.has(DEMO_SUPPLIER_ACCOUNT_ID)) {
  demoCreditRatings.set(DEMO_SUPPLIER_ACCOUNT_ID, [
    {
      msmfg_creditratingid: "demo-cr-001",
      msmfg_agency: "Experion",
      msmfg_rating: "A",
      msmfg_score: 782,
      msmfg_ratingdate: "2026-04-18",
      msmfg_notes: "Strong payment performance and low utilization.",
    },
    {
      msmfg_creditratingid: "demo-cr-002",
      msmfg_agency: "TransUnion",
      msmfg_rating: "A-",
      msmfg_score: 745,
      msmfg_ratingdate: "2026-03-22",
      msmfg_notes: "Stable outlook after expansion investment.",
    },
    {
      msmfg_creditratingid: "demo-cr-003",
      msmfg_agency: "BBB",
      msmfg_rating: "A+",
      msmfg_score: 91,
      msmfg_ratingdate: "2026-02-10",
      msmfg_notes: "No unresolved complaints in last 24 months.",
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
// Credit ratings
// ---------------------------------------------------------------------------

export async function getCreditRatings(accountId: string): Promise<CreditRating[]> {
  if (!isDataverseConfigured()) {
    return demoCreditRatings.get(accountId) ?? [];
  }

  const escaped = accountId.replace(/'/g, "''");
  return getRecords<CreditRating>(
    "msmfg_creditrating",
    `$select=msmfg_creditratingid,msmfg_agency,msmfg_rating,msmfg_score,msmfg_ratingdate,msmfg_notes&$filter=_msmfg_account_value eq '${escaped}'&$orderby=msmfg_ratingdate desc`
  );
}

export async function addCreditRating(
  accountId: string,
  agency: string,
  rating: string | null,
  score: number | null,
  ratingDate: string | null,
  notes: string | null
): Promise<string> {
  if (!isDataverseConfigured()) {
    const id = crypto.randomUUID();
    const list = demoCreditRatings.get(accountId) ?? [];
    list.unshift({
      msmfg_creditratingid: id,
      msmfg_agency: agency,
      msmfg_rating: rating,
      msmfg_score: score,
      msmfg_ratingdate: ratingDate,
      msmfg_notes: notes,
    });
    demoCreditRatings.set(accountId, list);
    return id;
  }

  const body: DataverseRecord = {
    "msmfg_account@odata.bind": `/accounts(${accountId})`,
    msmfg_agency: agency,
  };
  if (rating) body.msmfg_rating = rating;
  if (score != null) body.msmfg_score = score;
  if (ratingDate) body.msmfg_ratingdate = ratingDate;
  if (notes) body.msmfg_notes = notes;

  const created = await createRecord("msmfg_creditrating", body);
  if (!created.id) throw new Error("Could not create credit rating.");
  return created.id;
}
