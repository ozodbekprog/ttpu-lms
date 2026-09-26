import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { QR_TOKEN_GRACE_SECONDS, QR_TOKEN_TTL_SECONDS } from "./config";
import { checkInUrl, signQrToken, verifyQrToken } from "./qr-token";

const SESSION_ID = "session-1";
const COURSE_ID = "course-1";

beforeAll(() => {
  process.env.QR_TOKEN_SECRET = "test-secret";
});

afterEach(() => {
  vi.useRealTimers();
  process.env.QR_TOKEN_SECRET = "test-secret";
});

describe("qr-token", () => {
  it("sign va verify roundtrip sid/cid/lat/lng ni qaytaradi", async () => {
    const token = await signQrToken({
      sessionId: SESSION_ID,
      courseId: COURSE_ID,
      location: { lat: 41.3111, lng: 69.2797 },
    });
    const payload = await verifyQrToken(token);
    expect(payload).toMatchObject({ sid: SESSION_ID, cid: COURSE_ID, lat: 41.3111, lng: 69.2797 });
  });

  it("buzilgan token null qaytaradi", async () => {
    const token = await signQrToken({ sessionId: SESSION_ID, courseId: COURSE_ID });
    const last = token.slice(-1);
    const broken = token.slice(0, -1) + (last === "A" ? "B" : "A");
    expect(await verifyQrToken(broken)).toBeNull();
    expect(await verifyQrToken("not-a-token")).toBeNull();
    expect(await verifyQrToken("v1.only-two")).toBeNull();
  });

  it("muddati o'tgan token (grace dan keyin) null qaytaradi", async () => {
    vi.useFakeTimers();
    const token = await signQrToken({ sessionId: SESSION_ID, courseId: COURSE_ID });
    vi.advanceTimersByTime((QR_TOKEN_TTL_SECONDS + QR_TOKEN_GRACE_SECONDS + 1) * 1000);
    expect(await verifyQrToken(token)).toBeNull();
  });

  it("grace ichidagi token payload qaytaradi", async () => {
    vi.useFakeTimers();
    const token = await signQrToken({ sessionId: SESSION_ID, courseId: COURSE_ID });
    vi.advanceTimersByTime((QR_TOKEN_TTL_SECONDS + 1) * 1000);
    const payload = await verifyQrToken(token);
    expect(payload).toMatchObject({ sid: SESSION_ID, cid: COURSE_ID });
  });

  it("checkInUrl formati to'g'ri", async () => {
    const token = await signQrToken({ sessionId: SESSION_ID, courseId: COURSE_ID });
    expect(checkInUrl("https://example.com", token)).toBe(
      `https://example.com/attendance/check-in?t=${encodeURIComponent(token)}`,
    );
  });

  it("boshqa secret bilan imzolangan token null qaytaradi", async () => {
    process.env.QR_TOKEN_SECRET = "other-secret";
    const foreign = await signQrToken({ sessionId: SESSION_ID, courseId: COURSE_ID });
    process.env.QR_TOKEN_SECRET = "test-secret";
    expect(await verifyQrToken(foreign)).toBeNull();
  });
});
