import "server-only";

const DEMO_SUPPLIER_ACCOUNT_ID = "00000000-0000-0000-0000-000000000201";

export function resetDemoStoryData(): void {
  const accessRequests = globalThis.__supplierHubDemoStore ?? new Map();
  accessRequests.clear();
  accessRequests.set("demo-ar-001", {
    requestId: "demo-ar-001",
    requesterName: "Morgan Supply",
    requesterEmail: "morgan.supply@northwind.com",
    companyName: "Northwind Components",
    requestType: "Initial Access",
    role: "Supplier",
    decision: "Pending",
    createdOn: "2026-05-29T14:30:00.000Z",
    contactId: "00000000-0000-0000-0000-000000000401",
  });
  accessRequests.set("demo-ar-002", {
    requestId: "demo-ar-002",
    requesterName: "Sam Ops",
    requesterEmail: "sam.ops@adatum.com",
    companyName: "Adatum Manufacturing",
    requestType: "DEV Onboard",
    role: "Business",
    decision: "Pending",
    createdOn: "2026-05-31T09:15:00.000Z",
    contactId: "00000000-0000-0000-0000-000000000402",
  });
  accessRequests.set("demo-ar-003", {
    requestId: "demo-ar-003",
    requesterName: "Casey Quality",
    requesterEmail: "casey.quality@contoso.com",
    companyName: "Contoso Fabrication",
    requestType: "SME input",
    role: "Developer",
    decision: "Approved",
    createdOn: "2026-05-20T10:00:00.000Z",
    contactId: "00000000-0000-0000-0000-000000000403",
  });
  globalThis.__supplierHubDemoStore = accessRequests;

  const profiles = globalThis.__supplierHubDemoProfile ?? new Map();
  profiles.clear();
  profiles.set(DEMO_SUPPLIER_ACCOUNT_ID, {
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
  globalThis.__supplierHubDemoProfile = profiles;

  const identifiers = globalThis.__supplierHubDemoIdentifiers ?? new Map();
  identifiers.clear();
  identifiers.set(DEMO_SUPPLIER_ACCOUNT_ID, [
    { msmfg_identifierid: "demo-id-001", msmfg_type: "EIN", msmfg_value: "84-9182736" },
    { msmfg_identifierid: "demo-id-002", msmfg_type: "TAXID", msmfg_value: "TX-4471902" },
  ]);
  globalThis.__supplierHubDemoIdentifiers = identifiers;

  const capabilities = globalThis.__supplierHubDemoCaps ?? new Map();
  capabilities.clear();
  capabilities.set(DEMO_SUPPLIER_ACCOUNT_ID, [
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
  globalThis.__supplierHubDemoCaps = capabilities;

  const certifications = globalThis.__supplierHubDemoCerts ?? new Map();
  certifications.clear();
  certifications.set(DEMO_SUPPLIER_ACCOUNT_ID, [
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
  globalThis.__supplierHubDemoCerts = certifications;

  const ratings = globalThis.__supplierHubDemoCreditRatings ?? new Map();
  ratings.clear();
  ratings.set(DEMO_SUPPLIER_ACCOUNT_ID, [
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
  globalThis.__supplierHubDemoCreditRatings = ratings;

  const templates = globalThis.__supplierHubDemoTemplates ?? [];
  templates.length = 0;
  templates.push(
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
          msmfg_text: "What is your approximate annual carbon footprint (metric tons CO2e)?",
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
    }
  );
  globalThis.__supplierHubDemoTemplates = templates;

  const questionnaires = globalThis.__supplierHubDemoVQs ?? new Map();
  questionnaires.clear();
  questionnaires.set("demo-vq-001", {
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
        msmfg_question_text: "What is your approximate annual carbon footprint (metric tons CO2e)?",
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
  questionnaires.set("demo-vq-002", {
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
  questionnaires.set("demo-vq-003", {
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
  globalThis.__supplierHubDemoVQs = questionnaires;
}
