import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

function csrfSecret() {
  const secret = process.env.CSRF_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("CSRF_SECRET or AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function generateCsrfToken(): Promise<string> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(csrfSecret());

  const store = await cookies();
  store.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  return token;
}

export async function getCsrfToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CSRF_COOKIE_NAME)?.value || null;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, csrfSecret());
    return true;
  } catch {
    return false;
  }
}

export async function verifyCsrfFromRequest(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = (await cookies()).get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken) return false;
  if (headerToken !== cookieToken) return false;

  return validateCsrfToken(headerToken);
}

export function csrfHeaders(token: string) {
  return { [CSRF_HEADER_NAME]: token };
}