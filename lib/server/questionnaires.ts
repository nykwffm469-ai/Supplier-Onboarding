import "server-only";

import { createRecord, getRecords, updateRecord, type DataverseRecord } from "@/lib/server/dataverse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionType = "Public Safety" | "Sustainability";
export const questionTypeOptions: QuestionType[] = ["Public Safety", "Sustainability"];

export type QuestionTemplate = {
  msmfg_questionnairetemplateid: string;
  msmfg_name?: string;
};

export type Question = {
  msmfg_questionid: string;
  msmfg_name?: string;
  msmfg_questiontype?: string;
  msmfg_text?: string;
};

export type VendorQuestionnaire = {
  msmfg_vendorquestionnaireid: string;
  msmfg_name?: string;
  msmfg_status?: string; // "Draft" | "Submitted" | "Reviewed"
  msmfg_submittedon?: string | null;
  // expanded
  msmfg_template_name?: string;
};

export type QuestionnaireQuestion = {
  msmfg_questionnairequestionid: string;
  msmfg_answer?: string | null;
  // from expand
  msmfg_question_name?: string;
  msmfg_question_text?: string;
  msmfg_question_type?: string;
  questionId?: string;
};

export type VendorQuestionnaireDetail = VendorQuestionnaire & {
  questions: QuestionnaireQuestion[];
};

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------

type DemoTemplate = QuestionTemplate & { questions: Question[] };
type DemoVQ = VendorQuestionnaire & {
  accountId: string;
  templateId: string;
  questions: (QuestionnaireQuestion & { questionId: string })[];
};

declare global {
  var __supplierHubDemoTemplates: DemoTemplate[] | undefined;
  var __supplierHubDemoVQs: Map<string, DemoVQ> | undefined;
}

const SEED_TEMPLATES: DemoTemplate[] = [
  {
    msmfg_questionnairetemplateid: "tmpl-0001",
    msmfg_name: "Standard Supplier Questionnaire",
    questions: [
      {
        msmfg_questionid: "q-001",
        msmfg_name: "Emergency procedures",
        msmfg_questiontype: "Public Safety",
        msmfg_text: "Describe your emergency response procedures.",
      },
      {
        msmfg_questionid: "q-002",
        msmfg_name: "Hazardous materials",
        msmfg_questiontype: "Public Safety",
        msmfg_text: "Do you handle any hazardous materials? If yes, describe controls.",
      },
      {
        msmfg_questionid: "q-003",
        msmfg_name: "Carbon footprint",
        msmfg_questiontype: "Sustainability",
        msmfg_text: "What is your approximate annual carbon footprint (metric tons CO₂e)?",
      },
      {
        msmfg_questionid: "q-004",
        msmfg_name: "Sustainability certifications",
        msmfg_questiontype: "Sustainability",
        msmfg_text: "List any sustainability certifications your organization holds.",
      },
    ],
  },
  {
    msmfg_questionnairetemplateid: "tmpl-0002",
    msmfg_name: "Quality & Delivery Baseline",
    questions: [
      {
        msmfg_questionid: "q-101",
        msmfg_name: "On-time delivery",
        msmfg_questiontype: "Public Safety",
        msmfg_text: "What was your on-time delivery performance percentage over the last 12 months?",
      },
      {
        msmfg_questionid: "q-102",
        msmfg_name: "Defect rate",
        msmfg_questiontype: "Public Safety",
        msmfg_text: "Provide your average defect rate (PPM) for shipped units.",
      },
      {
        msmfg_questionid: "q-103",
        msmfg_name: "Continuous improvement",
        msmfg_questiontype: "Sustainability",
        msmfg_text: "Describe your continuous improvement program and last three initiatives.",
      },
    ],
  },
  {
    msmfg_questionnairetemplateid: "tmpl-0003",
    msmfg_name: "ESG & Compliance Deep Dive",
    questions: [
      {
        msmfg_questionid: "q-201",
        msmfg_name: "Scope emissions",
        msmfg_questiontype: "Sustainability",
        msmfg_text: "Report your Scope 1, Scope 2, and available Scope 3 emissions estimates.",
      },
      {
        msmfg_questionid: "q-202",
        msmfg_name: "Ethics policy",
        msmfg_questiontype: "Public Safety",
        msmfg_text: "Attach or summarize your anti-bribery and supplier code-of-conduct policy.",
      },
      {
        msmfg_questionid: "q-203",
        msmfg_name: "Third-party audits",
        msmfg_questiontype: "Sustainability",
        msmfg_text: "List independent audits completed in the last 24 months and findings.",
      },
    ],
  },
];

globalThis.__supplierHubDemoTemplates ??= SEED_TEMPLATES;
globalThis.__supplierHubDemoVQs ??= new Map<string, DemoVQ>();

const demoTemplates = globalThis.__supplierHubDemoTemplates;
const demoVQs = globalThis.__supplierHubDemoVQs;

const DEMO_SUPPLIER_ACCOUNT_ID = "00000000-0000-0000-0000-000000000201";

if (!demoVQs.has("demo-vq-001")) {
  demoVQs.set("demo-vq-001", {
    msmfg_vendorquestionnaireid: "demo-vq-001",
    msmfg_name: "Standard Supplier Questionnaire - Q2 Submission",
    msmfg_status: "Submitted",
    msmfg_submittedon: "2026-05-15T12:00:00.000Z",
    msmfg_template_name: "Standard Supplier Questionnaire",
    accountId: DEMO_SUPPLIER_ACCOUNT_ID,
    templateId: "tmpl-0001",
    questions: [
      {
        msmfg_questionnairequestionid: "demo-vq1-q1",
        questionId: "q-001",
        msmfg_question_name: "Emergency procedures",
        msmfg_question_text: "Describe your emergency response procedures.",
        msmfg_question_type: "Public Safety",
        msmfg_answer: "We maintain a 24/7 escalation tree with quarterly site drills and incident postmortems.",
      },
      {
        msmfg_questionnairequestionid: "demo-vq1-q2",
        questionId: "q-002",
        msmfg_question_name: "Hazardous materials",
        msmfg_question_text: "Do you handle any hazardous materials? If yes, describe controls.",
        msmfg_question_type: "Public Safety",
        msmfg_answer: "Yes. Controlled storage with ISO 14001-aligned handling SOPs and monthly audits.",
      },
      {
        msmfg_questionnairequestionid: "demo-vq1-q3",
        questionId: "q-003",
        msmfg_question_name: "Carbon footprint",
        msmfg_question_text: "What is your approximate annual carbon footprint (metric tons CO₂e)?",
        msmfg_question_type: "Sustainability",
        msmfg_answer: "Approx. 2,840 metric tons CO2e with a 9% year-over-year reduction trend.",
      },
      {
        msmfg_questionnairequestionid: "demo-vq1-q4",
        questionId: "q-004",
        msmfg_question_name: "Sustainability certifications",
        msmfg_question_text: "List any sustainability certifications your organization holds.",
        msmfg_question_type: "Sustainability",
        msmfg_answer: "ISO 14001 and internal supplier sustainability scorecard program.",
      },
    ],
  });

}

if (!demoVQs.has("demo-vq-002")) {
  demoVQs.set("demo-vq-002", {
    msmfg_vendorquestionnaireid: "demo-vq-002",
    msmfg_name: "Quality & Delivery Baseline - In Progress",
    msmfg_status: "Draft",
    msmfg_submittedon: null,
    msmfg_template_name: "Quality & Delivery Baseline",
    accountId: DEMO_SUPPLIER_ACCOUNT_ID,
    templateId: "tmpl-0002",
    questions: [
      {
        msmfg_questionnairequestionid: "demo-vq2-q1",
        questionId: "q-101",
        msmfg_question_name: "On-time delivery",
        msmfg_question_text: "What was your on-time delivery performance percentage over the last 12 months?",
        msmfg_question_type: "Public Safety",
        msmfg_answer: "97.6% on-time delivery across all production programs.",
      },
      {
        msmfg_questionnairequestionid: "demo-vq2-q2",
        questionId: "q-102",
        msmfg_question_name: "Defect rate",
        msmfg_question_text: "Provide your average defect rate (PPM) for shipped units.",
        msmfg_question_type: "Public Safety",
        msmfg_answer: "",
      },
      {
        msmfg_questionnairequestionid: "demo-vq2-q3",
        questionId: "q-103",
        msmfg_question_name: "Continuous improvement",
        msmfg_question_text: "Describe your continuous improvement program and last three initiatives.",
        msmfg_question_type: "Sustainability",
        msmfg_answer: "",
      },
    ],
  });

}

if (!demoVQs.has("demo-vq-003")) {
  demoVQs.set("demo-vq-003", {
    msmfg_vendorquestionnaireid: "demo-vq-003",
    msmfg_name: "ESG & Compliance Deep Dive - Reviewed",
    msmfg_status: "Reviewed",
    msmfg_submittedon: "2026-04-02T16:45:00.000Z",
    msmfg_template_name: "ESG & Compliance Deep Dive",
    accountId: DEMO_SUPPLIER_ACCOUNT_ID,
    templateId: "tmpl-0003",
    questions: [
      {
        msmfg_questionnairequestionid: "demo-vq3-q1",
        questionId: "q-201",
        msmfg_question_name: "Scope emissions",
        msmfg_question_text: "Report your Scope 1, Scope 2, and available Scope 3 emissions estimates.",
        msmfg_question_type: "Sustainability",
        msmfg_answer: "Scope 1: 420, Scope 2: 1,130, Scope 3 estimate underway with third-party consultant.",
      },
      {
        msmfg_questionnairequestionid: "demo-vq3-q2",
        questionId: "q-202",
        msmfg_question_name: "Ethics policy",
        msmfg_question_text: "Attach or summarize your anti-bribery and supplier code-of-conduct policy.",
        msmfg_question_type: "Public Safety",
        msmfg_answer: "Code-of-conduct signed annually by all employees and tier-1 suppliers.",
      },
      {
        msmfg_questionnairequestionid: "demo-vq3-q3",
        questionId: "q-203",
        msmfg_question_name: "Third-party audits",
        msmfg_question_text: "List independent audits completed in the last 24 months and findings.",
        msmfg_question_type: "Sustainability",
        msmfg_answer: "Two surveillance audits completed with no major non-conformances.",
      },
    ],
  });
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
// Templates (reviewer)
// ---------------------------------------------------------------------------

export async function getTemplates(): Promise<QuestionTemplate[]> {
  if (!isDataverseConfigured()) {
    return demoTemplates.map(({ msmfg_questionnairetemplateid, msmfg_name }) => ({
      msmfg_questionnairetemplateid,
      msmfg_name,
    }));
  }

  return getRecords<QuestionTemplate>(
    "msmfg_questionnairetemplate",
    "$select=msmfg_questionnairetemplateid,msmfg_name&$orderby=msmfg_name asc"
  );
}

// ---------------------------------------------------------------------------
// Vendor questionnaires (supplier view)
// ---------------------------------------------------------------------------

export async function getVendorQuestionnaires(accountId: string): Promise<VendorQuestionnaire[]> {
  if (!isDataverseConfigured()) {
    return Array.from(demoVQs.values())
      .filter((vq) => vq.accountId === accountId)
      .map(({ msmfg_vendorquestionnaireid, msmfg_name, msmfg_status, msmfg_submittedon, msmfg_template_name }) => ({
        msmfg_vendorquestionnaireid,
        msmfg_name,
        msmfg_status,
        msmfg_submittedon,
        msmfg_template_name,
      }));
  }

  const escaped = accountId.replace(/'/g, "''");
  return getRecords<VendorQuestionnaire>(
    "msmfg_vendorquestionnaire",
    `$select=msmfg_vendorquestionnaireid,msmfg_name,msmfg_status,msmfg_submittedon&$expand=msmfg_template($select=msmfg_name)&$filter=_msmfg_account_value eq '${escaped}'&$orderby=createdon desc`
  );
}

export async function getVendorQuestionnaireDetail(
  questionnaireId: string
): Promise<VendorQuestionnaireDetail | null> {
  if (!isDataverseConfigured()) {
    const vq = demoVQs.get(questionnaireId);
    if (!vq) return null;
    return {
      msmfg_vendorquestionnaireid: vq.msmfg_vendorquestionnaireid,
      msmfg_name: vq.msmfg_name,
      msmfg_status: vq.msmfg_status,
      msmfg_submittedon: vq.msmfg_submittedon,
      msmfg_template_name: vq.msmfg_template_name,
      questions: vq.questions,
    };
  }

  const rows = await getRecords<DataverseRecord>(
    "msmfg_questionnairequestion",
    `$select=msmfg_questionnairequestionid,msmfg_answer&$expand=msmfg_question($select=msmfg_questionid,msmfg_name,msmfg_text,msmfg_questiontype)&$filter=_msmfg_vendorquestionnaire_value eq '${questionnaireId}'`
  );

  if (!rows.length) return null;

  return {
    msmfg_vendorquestionnaireid: questionnaireId,
    questions: rows.map((r) => {
      const q = (r.msmfg_question ?? {}) as Record<string, unknown>;
      return {
        msmfg_questionnairequestionid: r.msmfg_questionnairequestionid as string,
        msmfg_answer: (r.msmfg_answer as string | null) ?? null,
        msmfg_question_name: q.msmfg_name as string | undefined,
        msmfg_question_text: q.msmfg_text as string | undefined,
        msmfg_question_type: q.msmfg_questiontype as string | undefined,
        questionId: q.msmfg_questionid as string | undefined,
      };
    }),
  };
}

export async function saveQuestionnaireAnswers(
  questionnaireId: string,
  answers: { questionnaireQuestionId: string; answer: string }[]
): Promise<void> {
  if (!isDataverseConfigured()) {
    const vq = demoVQs.get(questionnaireId);
    if (!vq) return;
    for (const a of answers) {
      const q = vq.questions.find(
        (qq) => qq.msmfg_questionnairequestionid === a.questionnaireQuestionId
      );
      if (q) q.msmfg_answer = a.answer;
    }
    return;
  }

  await Promise.all(
    answers.map((a) =>
      updateRecord("msmfg_questionnairequestion", a.questionnaireQuestionId, {
        msmfg_answer: a.answer,
      })
    )
  );
}

export async function submitQuestionnaire(questionnaireId: string): Promise<void> {
  if (!isDataverseConfigured()) {
    const vq = demoVQs.get(questionnaireId);
    if (vq) {
      vq.msmfg_status = "Submitted";
      vq.msmfg_submittedon = new Date().toISOString();
    }
    return;
  }

  await updateRecord("msmfg_vendorquestionnaire", questionnaireId, {
    msmfg_status: "Submitted",
    msmfg_submittedon: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Assign questionnaire (reviewer)
// ---------------------------------------------------------------------------

export async function assignQuestionnaire(
  templateId: string,
  accountId: string,
  contactId: string
): Promise<string> {
  if (!isDataverseConfigured()) {
    const tmpl = demoTemplates.find((t) => t.msmfg_questionnairetemplateid === templateId);
    if (!tmpl) throw new Error("Template not found.");

    const vqId = crypto.randomUUID();
    const questions = tmpl.questions.map((q) => ({
      msmfg_questionnairequestionid: crypto.randomUUID(),
      questionId: q.msmfg_questionid,
      msmfg_question_name: q.msmfg_name,
      msmfg_question_text: q.msmfg_text,
      msmfg_question_type: q.msmfg_questiontype,
      msmfg_answer: null,
    }));

    demoVQs.set(vqId, {
      msmfg_vendorquestionnaireid: vqId,
      msmfg_name: `${tmpl.msmfg_name} - ${new Date().toLocaleDateString()}`,
      msmfg_status: "Draft",
      msmfg_submittedon: null,
      msmfg_template_name: tmpl.msmfg_name,
      accountId,
      templateId,
      questions,
    });

    return vqId;
  }

  // Create vendor questionnaire
  const created = await createRecord("msmfg_vendorquestionnaire", {
    "msmfg_template@odata.bind": `/msmfg_questionnairetemplate(${templateId})`,
    "msmfg_account@odata.bind": `/accounts(${accountId})`,
    "msmfg_contact@odata.bind": `/contacts(${contactId})`,
    msmfg_status: "Draft",
  });

  if (!created.id) throw new Error("Could not create vendor questionnaire.");
  const vqId = created.id;

  // Pull template questions
  const tqs = await getRecords<{ msmfg_questionnairetemplatequestionid: string; _msmfg_question_value: string }>(
    "msmfg_questionnairetemplatequestion",
    `$select=msmfg_questionnairetemplatequestionid,_msmfg_question_value&$filter=_msmfg_template_value eq '${templateId}'`
  );

  // Create answer rows
  await Promise.all(
    tqs.map((tq) =>
      createRecord("msmfg_questionnairequestion", {
        "msmfg_vendorquestionnaire@odata.bind": `/msmfg_vendorquestionnaire(${vqId})`,
        "msmfg_question@odata.bind": `/msmfg_question(${tq._msmfg_question_value})`,
        msmfg_answer: null,
      })
    )
  );

  return vqId;
}
