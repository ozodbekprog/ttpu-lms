import { describe, expect, it } from "vitest";
import {
  formatRemaining,
  generateQrCode,
  isSessionActive,
  normalizeQrCode,
  QR_CODE_ALPHABET,
  QR_CODE_LENGTH,
  sessionProgress,
} from "@/components/attendance/qr-utils";

describe("normalizeQrCode", () => {
  it("kichik harflarni katta harflarga aylantiradi", () => {
    expect(normalizeQrCode("a1b2c3")).toBe("A1B2C3");
  });

  it("bo'sh joy va alifbodan tashqari simvollarni olib tashlaydi", () => {
    expect(normalizeQrCode(" a1 b2-c3 ")).toBe("A1B2C3");
    expect(normalizeQrCode("ab!c@d#")).toBe("ABCD");
  });

  it("6 belgidan ortiq qiymatni qisqartiradi", () => {
    expect(normalizeQrCode("abcdefghij")).toBe("ABCDEF");
    expect(normalizeQrCode("abcd-efgh")).toBe("ABCDEF");
  });

  it("bo'sh string uchun bo'sh string qaytaradi", () => {
    expect(normalizeQrCode("")).toBe("");
  });
});

describe("generateQrCode", () => {
  it("doimiy nol qiymatida alifboning birinchi belgisidan kod yasaydi", () => {
    const code = generateQrCode(() => 0);
    expect(code).toBe(QR_CODE_ALPHABET[0].repeat(QR_CODE_LENGTH));
    expect(code).toHaveLength(6);
  });

  it("eng katta indeksda alifboning oxirgi belgisidan kod yasaydi", () => {
    const code = generateQrCode((max) => max - 1);
    const last = QR_CODE_ALPHABET[QR_CODE_ALPHABET.length - 1];
    expect(code).toBe(last.repeat(QR_CODE_LENGTH));
  });

  it("kod uzunligi 6 va barcha belgilar alifbodan olinadi", () => {
    const picks = [0, 3, 9, 17, 25, 31];
    let index = 0;
    const code = generateQrCode(() => {
      const value = picks[index];
      index += 1;
      return value;
    });
    expect(code).toHaveLength(6);
    expect([...code].every((char) => QR_CODE_ALPHABET.includes(char))).toBe(true);
  });

  it("random funksiyaga har safar alifbo uzunligini uzatadi", () => {
    const limits: number[] = [];
    generateQrCode((max) => {
      limits.push(max);
      return 0;
    });
    expect(limits).toEqual(Array.from({ length: QR_CODE_LENGTH }, () => QR_CODE_ALPHABET.length));
  });
});

describe("isSessionActive", () => {
  it("kelajakdagi vaqt uchun true qaytaradi", () => {
    const now = Date.parse("2026-09-25T10:00:00.000Z");
    expect(isSessionActive(new Date(now + 60_000), now)).toBe(true);
  });

  it("o'tgan va ayni hozirgi vaqt uchun false qaytaradi", () => {
    const now = Date.parse("2026-09-25T10:00:00.000Z");
    expect(isSessionActive(new Date(now - 60_000), now)).toBe(false);
    expect(isSessionActive(new Date(now), now)).toBe(false);
  });

  it("string ko'rinishidagi sanani ham qabul qiladi", () => {
    const now = Date.parse("2026-09-25T10:00:00.000Z");
    expect(isSessionActive("2026-09-25T10:05:00.000Z", now)).toBe(true);
    expect(isSessionActive("2026-09-25T09:55:00.000Z", now)).toBe(false);
  });
});

describe("sessionProgress", () => {
  const createdAt = "2026-09-25T10:00:00.000Z";
  const expiresAt = "2026-09-25T10:10:00.000Z";

  it("boshida 1 ga, o'rtasida 0.5 ga teng", () => {
    const created = Date.parse(createdAt);
    const expires = Date.parse(expiresAt);
    expect(sessionProgress(new Date(created), new Date(expires), created)).toBe(1);
    expect(sessionProgress(createdAt, expiresAt, (created + expires) / 2)).toBe(0.5);
  });

  it("tugaganda va tugagandan keyin 0 qaytaradi", () => {
    const expires = Date.parse(expiresAt);
    expect(sessionProgress(createdAt, expiresAt, expires)).toBe(0);
    expect(sessionProgress(createdAt, expiresAt, expires + 60_000)).toBe(0);
  });

  it("expires created dan kichik yoki teng bo'lsa 0 qaytaradi", () => {
    const created = Date.parse(createdAt);
    expect(sessionProgress(expiresAt, createdAt, created)).toBe(0);
    expect(sessionProgress(createdAt, createdAt, created)).toBe(0);
  });

  it("natija har doim 0 va 1 oralig'ida bo'ladi", () => {
    const created = Date.parse(createdAt);
    const expires = Date.parse(expiresAt);
    const samples = [created - 60_000, created, created + 60_000, expires - 1, expires, expires + 60_000];
    for (const sample of samples) {
      const value = sessionProgress(createdAt, expiresAt, sample);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("formatRemaining", () => {
  it("nol uchun 00:00 qaytaradi", () => {
    expect(formatRemaining(0)).toBe("00:00");
  });

  it("sekundlarni mm:ss ko'rinishida qaytaradi", () => {
    expect(formatRemaining(59_000)).toBe("00:59");
    expect(formatRemaining(60_000)).toBe("01:00");
    expect(formatRemaining(90_000)).toBe("01:30");
  });

  it("bir soatlik qiymatni daqiqalarda ifodalaydi", () => {
    expect(formatRemaining(3_600_000)).toBe("60:00");
  });

  it("manfiy qiymatda 00:00 ga tushadi", () => {
    expect(formatRemaining(-1_000)).toBe("00:00");
    expect(formatRemaining(-90_000)).toBe("00:00");
  });
});
