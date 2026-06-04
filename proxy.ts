import { NextResponse, type NextRequest } from "next/server";

import { getDemoSessionFromRequest } from "@/lib/demo-auth";
import { getRequestOrigin } from "@/lib/request-origin";

const publicPaths = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = getRequestOrigin(request);
  const session = getDemoSessionFromRequest(request);
  const hasSession = Boolean(session);
  const role = session?.role ?? "supplier";
  const isPublicPath = publicPaths.includes(pathname);

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  if (hasSession && pathname.startsWith("/admin") && role !== "reviewer") {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|\.swa).*)"],
};
