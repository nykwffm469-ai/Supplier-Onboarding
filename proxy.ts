import { NextResponse, type NextRequest } from "next/server";

import { getDemoSessionFromRequest } from "@/lib/demo-auth";

const publicPaths = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getDemoSessionFromRequest(request);
  const hasSession = Boolean(session);
  const role = session?.role ?? "supplier";
  const isPublicPath = publicPaths.includes(pathname);

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (hasSession && pathname.startsWith("/admin") && role !== "reviewer") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
