import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-compatible proxy for route protection.
 *
 * Uses cookie-based session checking (no Prisma/Node.js imports),
 * so it works in Edge Runtime without issues.
 */

const PROTECTED_PATHS = ["/dashboard", "/history", "/humanize"];

function isProtected(path: string): boolean {
  return PROTECTED_PATHS.some((p) => path.startsWith(p));
}

// NextAuth.js v5 uses "authjs.session-token" cookie for JWT sessions
const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
];

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check for session cookie
  const sessionToken = AUTH_COOKIE_NAMES
    .map((name) => request.cookies.get(name)?.value)
    .find(Boolean);

  const isLoggedIn = !!sessionToken;

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && isProtected(path)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    "/humanize/:path*",
    "/login",
    "/register",
  ],
};
