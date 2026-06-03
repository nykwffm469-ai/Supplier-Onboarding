import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import type { UserRole } from "@/lib/auth";
import { normalizeRole } from "@/lib/auth";

export const DEMO_AUTH_COOKIE = "supplierhub_demo_auth";

export type DemoSession = {
  name: string;
  email: string;
  role: UserRole;
  contactId: string | null;
  accountId: string | null;
};

export type DemoUserKey = "supplier" | "reviewer";

export const DEMO_USERS: Record<DemoUserKey, DemoSession> = {
  supplier: {
    name: "Taylor Supplier",
    email: "supplier.demo@contoso.com",
    role: "supplier",
    contactId: "00000000-0000-0000-0000-000000000101",
    accountId: "00000000-0000-0000-0000-000000000201",
  },
  reviewer: {
    name: "Riley Reviewer",
    email: "reviewer.demo@contoso.com",
    role: "reviewer",
    contactId: "00000000-0000-0000-0000-000000000102",
    accountId: "00000000-0000-0000-0000-000000000202",
  },
};

function encodeSession(session: DemoSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

function decodeSession(value?: string | null): DemoSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<DemoSession>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      name: typeof parsed.name === "string" ? parsed.name : "Demo User",
      email:
        typeof parsed.email === "string" ? parsed.email : "demo.user@contoso.com",
      role: normalizeRole(parsed.role),
      contactId: typeof parsed.contactId === "string" ? parsed.contactId : null,
      accountId: typeof parsed.accountId === "string" ? parsed.accountId : null,
    };
  } catch {
    return null;
  }
}

export function getDemoSessionFromRequest(request: NextRequest): DemoSession | null {
  return decodeSession(request.cookies.get(DEMO_AUTH_COOKIE)?.value);
}

export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(DEMO_AUTH_COOKIE)?.value);
}

export function getDemoSessionCookieValue(userKey: DemoUserKey): string {
  return encodeSession(DEMO_USERS[userKey]);
}
