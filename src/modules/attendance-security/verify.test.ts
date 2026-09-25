import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  auditLog: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  clientIpFromHeaders,
  evaluateCheckInRisk,
  haversineMeters,
  lookupIpGeo,
} from "./verify";

function ipResponse(data: Record<string, unknown>): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  prismaMock.auditLog.findFirst.mockReset().mockResolvedValue(null);
  prismaMock.auditLog.findMany.mockReset().mockResolvedValue([]);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("haversineMeters", () => {
  it("Toshkent ichidagi ikki nuqta orasidagi masofani metrda hisoblaydi", () => {
    const distance = haversineMeters(
      { lat: 41.311081, lng: 69.240562 },
      { lat: 41.321081, lng: 69.240562 },
    );
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1224);
  });
});

describe("clientIpFromHeaders", () => {
  it("x-forwarded-for dagi birinchi qiymatni qaytaradi", () => {
    const headers = new Headers({ "x-forwarded-for": " 8.8.8.8, 10.0.0.1" });
    expect(clientIpFromHeaders(headers)).toBe("8.8.8.8");
  });

  it("x-forwarded-for yo'q bo'lsa x-real-ip ishlatadi", () => {
    const headers = new Headers({ "x-real-ip": " 8.8.4.4" });
    expect(clientIpFromHeaders(headers)).toBe("8.8.4.4");
  });

  it("bo'sh yoki yo'q header null qaytaradi", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "  " }))).toBeNull();
    expect(clientIpFromHeaders(new Headers())).toBeNull();
  });
});

describe("lookupIpGeo", () => {
  it("private IP uchun fetch chaqirmaydi", async () => {
    await expect(lookupIpGeo("192.168.1.10")).resolves.toBeNull();
    await expect(lookupIpGeo("::1")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("evaluateCheckInRisk", () => {
  const tokenLocation = { lat: 41.311081, lng: 69.240562 };

  it("yaqin joylashuv va proxy yo'q bo'lsa shubhali emas", async () => {
    vi.mocked(fetch).mockResolvedValue(
      ipResponse({
        status: "success",
        country: "Uzbekistan",
        city: "Tashkent",
        lat: tokenLocation.lat,
        lon: tokenLocation.lng,
        proxy: false,
        hosting: false,
        query: "8.8.8.8",
      }),
    );

    const result = await evaluateCheckInRisk({
      studentId: "student-1",
      sessionId: "session-1",
      courseId: "course-1",
      tokenLocation,
      studentLocation: { ...tokenLocation, accuracy: 20 },
      ip: "8.8.8.8",
    });

    expect(result.suspicious).toBe(false);
    expect(result.reasons).toEqual([]);
    expect(result.distanceM).toBe(0);
  });

  it("uzoq joylashuv uchun GEO_FAR qaytaradi", async () => {
    vi.mocked(fetch).mockResolvedValue(
      ipResponse({
        status: "success",
        lat: 41.4,
        lon: 69.24,
        proxy: false,
        hosting: false,
        query: "1.1.1.1",
      }),
    );

    const result = await evaluateCheckInRisk({
      studentId: "student-2",
      sessionId: "session-2",
      courseId: "course-2",
      tokenLocation,
      studentLocation: { lat: 41.4, lng: 69.24, accuracy: 20 },
      ip: "1.1.1.1",
    });

    expect(result.suspicious).toBe(true);
    expect(result.reasons).toContain("GEO_FAR");
    expect(result.distanceM).toBeGreaterThan(200);
  });

  it("studentLocation yo'q bo'lsa GEO_MISSING qaytaradi", async () => {
    const result = await evaluateCheckInRisk({
      studentId: "student-3",
      sessionId: "session-3",
      courseId: "course-3",
      tokenLocation,
    });

    expect(result.suspicious).toBe(true);
    expect(result.reasons).toContain("GEO_MISSING");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("proxy yoki hosting belgisi VPN_SUSPECTED qaytaradi", async () => {
    vi.mocked(fetch).mockResolvedValue(
      ipResponse({
        status: "success",
        proxy: true,
        hosting: false,
        query: "9.9.9.9",
      }),
    );

    const result = await evaluateCheckInRisk({
      studentId: "student-4",
      sessionId: "session-4",
      courseId: "course-4",
      tokenLocation,
      studentLocation: { ...tokenLocation, accuracy: 20 },
      ip: "9.9.9.9",
    });

    expect(result.suspicious).toBe(true);
    expect(result.reasons).toContain("VPN_SUSPECTED");
  });

  it("oldingi IP va boshqa talabaning IPsi aniqlansa risk qaytaradi", async () => {
    vi.mocked(fetch).mockResolvedValue(
      ipResponse({ status: "success", query: "4.4.4.4" }),
    );
    prismaMock.auditLog.findFirst.mockResolvedValue({ meta: { ip: "5.5.5.5" } });
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        actorId: "student-6",
        meta: { sessionId: "session-5", ip: "4.4.4.4" },
      },
    ]);

    const result = await evaluateCheckInRisk({
      studentId: "student-5",
      sessionId: "session-5",
      courseId: "course-5",
      tokenLocation,
      studentLocation: { ...tokenLocation, accuracy: 20 },
      ip: "4.4.4.4",
    });

    expect(result.reasons).toEqual(["IP_CHANGED", "IP_SHARED"]);
  });
});
