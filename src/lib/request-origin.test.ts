import { afterEach, describe, expect, it, vi } from "vitest";
import { requestOrigin } from "./request-origin";

function makeRequest(headers: Record<string, string>) {
  return new Request("http://0.0.0.0:3000/api/attendance/sessions/x/token", {
    headers,
  });
}

describe("requestOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("x-forwarded-host va x-forwarded-proto ni ishlatadi", () => {
    expect(
      requestOrigin(
        makeRequest({
          "x-forwarded-host": "lms.ttpu.uz",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe("https://lms.ttpu.uz");
  });

  it("Host sarlavhasiga tayanadi (LAN manzil)", () => {
    expect(requestOrigin(makeRequest({ host: "192.168.1.50:3000" }))).toBe(
      "http://192.168.1.50:3000",
    );
  });

  it("0.0.0.0 hostni tashlab, request.url ga qaytadi", () => {
    expect(requestOrigin(makeRequest({ host: "0.0.0.0:3000" }))).toBe(
      "http://0.0.0.0:3000",
    );
  });

  it("APP_URL ustuvor va oxirgi / olib tashlanadi", () => {
    vi.stubEnv("APP_URL", "https://lms.example.uz/");
    expect(requestOrigin(makeRequest({ host: "0.0.0.0:3000" }))).toBe(
      "https://lms.example.uz",
    );
  });

  it("ko'p qiymatli sarlavhalarda birinchisini oladi", () => {
    expect(
      requestOrigin(
        makeRequest({
          "x-forwarded-host": "lms.ttpu.uz, proxy.local",
          "x-forwarded-proto": "https, http",
        }),
      ),
    ).toBe("https://lms.ttpu.uz");
  });
});
