import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast auth pre-check for protected app routes.
 *
 * This is ONLY a cheap "is there a session cookie?" gate that runs before the
 * page is rendered. It does NOT verify the JWT signature, expiration, user
 * status, session epoch or role — real authorization stays in the server-side
 * `requireUser()` / `requireRole()` (src/lib/auth.ts). The goal here is to
 * answer protected requests with a real HTTP 307 instead of a streamed 200
 * that only redirects via a meta-refresh/JS after `requireUser()` runs.
 *
 * Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`. Both
 * are still supported, but they cannot coexist (the build fails with E900),
 * so this file replaces the previous `src/proxy.ts`.
 */

const SESSION_COOKIE = "ttpu_session";

/** Pages that must stay reachable without a session (auth flow, landing). */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

/** Public prefixes: framework internals, API routes, uploaded files. */
const PUBLIC_PREFIXES = ["/_next/", "/api/", "/uploads/"];

/** Individual public files served from /public. */
const PUBLIC_FILES = new Set([
  "/manifest.webmanifest",
  "/sw.js",
  "/robots.txt",
  "/favicon.ico",
  "/icon.svg",
  "/logo.svg",
]);

/** Any path whose last segment looks like a static file (photo.png, app.webmanifest, ...). */
const FILE_EXTENSION = /\.[a-z0-9]+$/i;

function isPublicPath(pathname: string): boolean {
  // Treat "/login/" the same as "/login" (Next normalizes the trailing slash
  // only after middleware has already run).
  const path =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (PUBLIC_PATHS.has(path)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return true;
  if (PUBLIC_FILES.has(path)) return true;
  return FILE_EXTENSION.test(path);
}

/**
 * Cheap shape check for the httpOnly session JWT (`header.payload.signature`).
 * A malformed cookie is treated as "no session"; a well-formed but forged or
 * expired token still passes this gate and is rejected by `requireUser()`.
 */
function looksLikeSessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Public pages and static/API assets never need the cookie gate.
  if (isPublicPath(pathname)) return NextResponse.next();

  if (!looksLikeSessionCookie(request.cookies.get(SESSION_COOKIE)?.value)) {
    // `next` is built from the request's own pathname+search, so it can never
    // point at another origin (no open redirect); it is also URL-encoded.
    return NextResponse.redirect(
      new URL("/login?next=" + encodeURIComponent(pathname + search), request.url),
      307,
    );
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Skip the middleware entirely for API routes and static assets (Next
   * chunks/images, fonts, manifests, uploaded files, ...) so they are never
   * redirected. `.*\..*` excludes any path containing a dot (file extension),
   * matching the public-path allowlist above — protected page routes have no
   * dots in their paths.
   */
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
