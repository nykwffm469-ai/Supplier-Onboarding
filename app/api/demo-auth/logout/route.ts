import { NextResponse, type NextRequest } from "next/server";

import { DEMO_AUTH_COOKIE } from "@/lib/demo-auth";
import { getRequestOrigin, getSafeCallbackPath } from "@/lib/request-origin";

function clearCookie(response: NextResponse) {
  response.cookies.set(DEMO_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const callbackPath = getSafeCallbackPath(
    request.nextUrl.searchParams.get("callbackUrl"),
    "/login"
  );
  const response = NextResponse.redirect(new URL(callbackPath, getRequestOrigin(request)));
  clearCookie(response);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearCookie(response);
  return response;
}
