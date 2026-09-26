import { describe, expect, it } from "vitest";
import { checkInPathForToken, formatSecondsLeft, parseQrPayload, tokenFromQr } from "./live-qr";

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

describe("tokenFromQr", () => {
  it("havoladan tokenni ajratib oladi", () => {
    expect(
      tokenFromQr("https://example.com/attendance/check-in?t=v1.abc.def"),
    ).toBe("v1.abc.def");
  });

  it("xom token matnini qabul qiladi", () => {
    expect(tokenFromQr("v1.abc.def")).toBe("v1.abc.def");
  });

  it("tokensiz havola uchun null qaytaradi", () => {
    expect(tokenFromQr("https://example.com/")).toBeNull();
  });

  it("begona matn uchun null qaytaradi", () => {
    expect(tokenFromQr("shunchaki matn")).toBeNull();
  });
});

describe("parseQrPayload", () => {
  it("code parametrli havolani o'qiydi", () => {
    expect(
      parseQrPayload("https://example.com/attendance/check-in?code=ab2c3d"),
    ).toEqual({ code: "AB2C3D" });
  });

  it("xom 6 belgili kodni o'qiydi", () => {
    expect(parseQrPayload("aB2c3D")).toEqual({ code: "AB2C3D" });
  });

  it("token va kodni aralashtirmaydi", () => {
    expect(parseQrPayload("v1.abc.def")).toEqual({ token: "v1.abc.def" });
    expect(parseQrPayload("salom")).toBeNull();
  });

  it("begona havola uchun null qaytaradi", () => {
    expect(parseQrPayload("https://example.com/")).toBeNull();
  });
});
