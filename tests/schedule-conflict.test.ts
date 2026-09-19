import { describe, expect, it } from "vitest";
import { parityMatches } from "@/app/api/schedule/_helpers";
import { isoWeekNumber, weekParityOf } from "@/components/schedule/week-utils";

describe("parityMatches: hafta pariteti qoidasi", () => {
  it("entry parity null bo'lsa har ikki haftada ham ko'rinadi", () => {
    expect(parityMatches(null, "odd")).toBe(true);
    expect(parityMatches(null, "even")).toBe(true);
  });

  it("odd parity toq haftada ko'rinadi, juft haftada yo'q", () => {
    expect(parityMatches("odd", "odd")).toBe(true);
    expect(parityMatches("odd", "even")).toBe(false);
  });

  it("even parity juft haftada ko'rinadi, toq haftada yo'q", () => {
    expect(parityMatches("even", "even")).toBe(true);
    expect(parityMatches("even", "odd")).toBe(false);
  });

  it("null bo'lmagan noto'g'ri parity hech qaysi haftaga mos kelmaydi", () => {
    expect(parityMatches("both", "odd")).toBe(false);
    expect(parityMatches("both", "even")).toBe(false);
  });
});

describe("weekParityOf: ISO hafta raqami juftligi", () => {
  it("2-hafta juft, 3-hafta toq deb aniqlanadi", () => {
    expect(isoWeekNumber("2026-01-05")).toBe(2);
    expect(weekParityOf("2026-01-05")).toBe("even");
    expect(isoWeekNumber("2026-01-12")).toBe(3);
    expect(weekParityOf("2026-01-12")).toBe("odd");
  });

  it("qo'shni haftalar almashinuvchi paritetga ega", () => {
    expect(weekParityOf("2025-12-29")).toBe("odd");
    expect(weekParityOf("2026-01-05")).toBe("even");
    expect(weekParityOf("2026-01-12")).toBe("odd");
    expect(weekParityOf("2026-01-19")).toBe("even");
  });

  it("parityMatches shu haftalar uchun entry paritetini to'g'ri filtrlaydi", () => {
    const oddWeek = weekParityOf("2026-01-12");
    const evenWeek = weekParityOf("2026-01-19");
    expect(parityMatches("odd", oddWeek)).toBe(true);
    expect(parityMatches("even", oddWeek)).toBe(false);
    expect(parityMatches("even", evenWeek)).toBe(true);
    expect(parityMatches("odd", evenWeek)).toBe(false);
  });
});
