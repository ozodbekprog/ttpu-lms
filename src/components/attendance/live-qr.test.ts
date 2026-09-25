import { describe, expect, it } from "vitest";
import { checkInPathForToken, formatSecondsLeft } from "./live-qr";

describe("formatSecondsLeft", () => {
  it("0 ms uchun 00:00 qaytaradi", () => {
    expect(formatSecondsLeft(0)).toBe("00:00");
  });

  it("7000 ms uchun 00:07 qaytaradi", () => {
    expect(formatSecondsLeft(7000)).toBe("00:07");
  });

  it("65000 ms uchun 01:05 qaytaradi", () => {
    expect(formatSecondsLeft(65000)).toBe("01:05");
  });

  it("manfiy qiymat uchun 00:00 qaytaradi", () => {
    expect(formatSecondsLeft(-5000)).toBe("00:00");
  });
});

describe("checkInPathForToken", () => {
  it("tokenni query param sifatida qo'shadi", () => {
    expect(checkInPathForToken("abc123")).toBe("/attendance/check-in?t=abc123");
  });

  it("maxsus belgilarni encode qiladi", () => {
    const token = "a+b/c=d&e f?";
    expect(checkInPathForToken(token)).toBe(
      `/attendance/check-in?t=${encodeURIComponent(token)}`,
    );
  });
});
