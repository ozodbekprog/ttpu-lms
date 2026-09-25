import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "ttpu_session";

const PROTECTED_PREFIXES = [
  "/academic-calendar",
  "/admin",
  "/attendance",
  "/bookings",
  "/calendar",
  "/catalog",
  "/certificates",
  "/courses",
  "/curator",
  "/dashboard",
  "/electives",
  "/exams",
  "/gpa",
  "/grades",
  "/help",
  "/journal",
  "/journals",
  "/messages",
  "/notifications",
  "/orders",
  "/profile",
  "/question-bank",
  "/quizzes",
  "/reports",
  "/rooms",
  "/schedule",
  "/search",
  "/settings",
  "/transcript",
  "/users",
  "/workload",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
