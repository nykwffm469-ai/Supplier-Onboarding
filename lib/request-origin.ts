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

function getOriginFromUrlHeader(value: string | null): string | null {
  const rawValue = getFirstHeaderValue(value);

  if (!rawValue) {
    return null;
  }

  try {
    return new URL(rawValue).origin;
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: NextRequest): string {
  const originalUrlOrigin =
    getOriginFromUrlHeader(request.headers.get("x-ms-original-url")) ??
    getOriginFromUrlHeader(request.headers.get("x-original-url")) ??
    getOriginFromUrlHeader(request.headers.get("x-forwarded-url"));

  if (originalUrlOrigin) {
    return originalUrlOrigin;
  }

  const originalHost =
    getFirstHeaderValue(request.headers.get("x-ms-original-host")) ??
    getFirstHeaderValue(request.headers.get("x-original-host"));
  const forwardedHost = getFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = getFirstHeaderValue(request.headers.get("x-forwarded-proto"));
  const host = originalHost ?? forwardedHost ?? request.headers.get("host");
  const protocol = forwardedProto ?? "https";

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
