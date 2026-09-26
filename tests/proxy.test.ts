import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const VALID_SESSION = "header.payload.signature";

function makeRequest(path: string, session?: string) {
  return new NextRequest(new URL(path, "http://localhost"), {
    headers: session ? { cookie: `ttpu_session=${session}` } : undefined,
  });
}

function isPassthrough(res: Response) {
  return res.headers.get("x-middleware-next") === "1";
}

describe("proxy (auth pre-check)", () => {
  it("cookie yo'q: /dashboard → 307 /login?next=...", () => {
    const res = proxy(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fdashboard",
    );
  });

  it("query string `next` ichida saqlanadi", () => {
    const res = proxy(makeRequest("/schedule?week=3"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fschedule%3Fweek%3D3",
    );
  });

  it("sessiya cookie mavjud bo'lsa o'tkazib yuboriladi", () => {
    const res = proxy(makeRequest("/dashboard", VALID_SESSION));
    expect(res.status).toBe(200);
    expect(isPassthrough(res)).toBe(true);
  });

  it("buzilgan cookie shakli himoyalangan sahifaga o'tkazmaydi", () => {
    const res = proxy(makeRequest("/admin", "not-a-jwt"));
    expect(res.status).toBe(307);
  });

  it("public sahifa/assetlar cookie'siz ham o'tadi", () => {
    for (const path of [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/api/csrf",
      "/api/auth/login",
      "/sw.js",
      "/manifest.webmanifest",
      "/robots.txt",
      "/favicon.ico",
      "/logo.svg",
      "/uploads/submissions/file.pdf",
    ]) {
      const res = proxy(makeRequest(path));
      expect(isPassthrough(res), `${path} o'tishi kerak`).toBe(true);
    }
  });

  it("himoyalangan sahifalar cookie'siz redirect qilinadi", () => {
    for (const path of ["/dashboard", "/admin", "/profile", "/settings", "/help"]) {
      const res = proxy(makeRequest(path));
      expect(res.status, path).toBe(307);
    }
  });

  it("`next` har doim lokal path (tashqi origin emas)", () => {
    const res = proxy(makeRequest("/dashboard"));
    const location = res.headers.get("location") ?? "";
    expect(location.startsWith("http://localhost/login?next=%2F")).toBe(true);
    expect(location).not.toContain("example.com");
    expect(location).not.toContain("//example");
  });
});
