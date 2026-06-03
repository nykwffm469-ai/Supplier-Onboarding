export type UserRole = "supplier" | "reviewer";

export function normalizeRole(role?: string | null): UserRole {
  return role === "reviewer" ? "reviewer" : "supplier";
}
