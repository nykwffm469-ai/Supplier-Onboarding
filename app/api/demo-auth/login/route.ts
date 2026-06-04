import { NextResponse, type NextRequest } from "next/server";

import {
  DEMO_AUTH_COOKIE,
  getDemoSessionCookieValue,
  type DemoUserKey,
} from "@/lib/demo-auth";
import { getSafeCallbackPath } from "@/lib/request-origin";

const validUsers: DemoUserKey[] = ["supplier", "reviewer"];

function getRequestedUser(value: string | null): DemoUserKey {
  if (value === "reviewer") {
    return "reviewer";
  }

  return "supplier";
}

export async function GET(request: NextRequest) {
  const callbackPath = getSafeCallbackPath(
    request.nextUrl.searchParams.get("callbackUrl"),
    "/dashboard"
  );
  const user = getRequestedUser(request.nextUrl.searchParams.get("user"));
  const response = NextResponse.redirect(new URL("/", request.url));
  response.headers.set("location", callbackPath);

  response.cookies.set(DEMO_AUTH_COOKIE, getDemoSessionCookieValue(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { user?: string };
  const user = getRequestedUser(body.user ?? null);

  if (!validUsers.includes(user)) {
    return NextResponse.json({ error: "Invalid demo user" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_AUTH_COOKIE, getDemoSessionCookieValue(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
