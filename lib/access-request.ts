export const requestTypeOptions = [
  "Initial Access",
  "DEV Onboard",
  "SME input",
] as const;

export const roleOptions = [
  "Developer",
  "Supplier",
  "Business",
  "Distribution",
] as const;

export type RequestType = (typeof requestTypeOptions)[number];
export type RequestRole = (typeof roleOptions)[number];

export type RequestDecision = "Pending" | "Approved" | "Rejected";
