import type { NextRequest } from "next/server";

function getFirstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean) ?? null;
}

export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = getFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = getFirstHeaderValue(request.headers.get("x-forwarded-proto"));
  const host = forwardedHost ?? request.headers.get("host");
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");

  if (host && protocol) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}

export function getSafeCallbackPath(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
