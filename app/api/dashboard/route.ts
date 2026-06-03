import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-auth";
import { getPendingAccessRequests } from "@/lib/server/access-request";
import { getVendorCapabilities, getVendorCertifications } from "@/lib/server/capabilities";
import { getAccountProfile, getIdentifiers } from "@/lib/server/profile";
import { getVendorQuestionnaires } from "@/lib/server/questionnaires";

export async function GET() {
  const session = await getDemoSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "reviewer") {
    let pendingRequests = 0;
    try {
      pendingRequests = (await getPendingAccessRequests()).length;
    } catch {
      pendingRequests = 0;
    }

    // Count submitted questionnaires
    let pendingQuestionnaires = 0;
    try {
      const demoVqs = globalThis.__supplierHubDemoVQs;
      if (demoVqs && demoVqs.size > 0) {
        pendingQuestionnaires = Array.from(demoVqs.values()).filter(
          (q) => q.msmfg_status === "Submitted"
        ).length;
      } else {
        const vqs = session.accountId ? await getVendorQuestionnaires(session.accountId) : [];
        pendingQuestionnaires = vqs.filter((q) => q.msmfg_status === "Submitted").length;
      }
    } catch {
      pendingQuestionnaires = 0;
    }

    return NextResponse.json({
      role: "reviewer",
      counts: { pendingRequests, pendingQuestionnaires },
    });
  }

  // Supplier checklist
  const accountId = session.accountId;

  if (!accountId) {
    return NextResponse.json({
      role: "supplier",
      checklist: {
        profile: false,
        capabilities: false,
        certifications: false,
        questionnaire: false,
        approved: false,
      },
    });
  }

  const [profile, identifiers, capabilities, certifications, questionnaires] = await Promise.allSettled([
    getAccountProfile(accountId),
    getIdentifiers(accountId),
    getVendorCapabilities(accountId),
    getVendorCertifications(accountId),
    getVendorQuestionnaires(accountId),
  ]);

  const profileVal = profile.status === "fulfilled" ? profile.value : null;
  const idsVal = identifiers.status === "fulfilled" ? identifiers.value : [];
  const capsVal = capabilities.status === "fulfilled" ? capabilities.value : [];
  const certsVal = certifications.status === "fulfilled" ? certifications.value : [];
  const vqsVal = questionnaires.status === "fulfilled" ? questionnaires.value : [];

  const profileComplete = !!(
    profileVal &&
    (profileVal.msmfg_yearlyrevenuetotal != null ||
      profileVal.msmfg_employeeexpectedturnover != null ||
      idsVal.length > 0)
  );

  return NextResponse.json({
    role: "supplier",
    checklist: {
      profile: profileComplete,
      capabilities: capsVal.length > 0,
      certifications: certsVal.length > 0,
      questionnaire: vqsVal.some((q) => q.msmfg_status === "Submitted"),
      approved: true,
    },
  });
}
