import { NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api"]);

function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export function middleware(req: NextRequest): NextResponse {
  const hostHeader = req.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0];

  if (!host || host.includes("localhost") || host.endsWith("vercel.app")) {
    return NextResponse.next();
  }

  const parts = host.split(".");
  if (parts.length < 3) {
    return NextResponse.next();
  }

  const subdomain = parts[0];
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain) || shouldBypass(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const rewriteUrl = req.nextUrl.clone();
  rewriteUrl.pathname = `/${subdomain}${req.nextUrl.pathname}`;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/:path*"]
};
