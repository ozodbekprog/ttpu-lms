import { describe, expect, it } from "vitest";
import { classifyBug, friendlyBugLine } from "./bug-utils";

describe("classifyBug", () => {
  it("baza xatolarini aniqlaydi", () => {
    expect(classifyBug("PrismaClientKnownRequestError P2002").title).toBe(
      "Ma'lumotlar bazasi",
    );
  });

  it("tarmoq xatolarini aniqlaydi", () => {
    expect(classifyBug("TypeError: Failed to fetch").title).toBe("Tarmoq aloqasi");
  });

  it("CSRF xatolarini aniqlaydi", () => {
    expect(classifyBug("CSRF token yaroqsiz").title).toBe("Xavfsizlik (CSRF)");
  });

  it("noma'lum xatolik uchun boshqa qaytaradi", () => {
    expect(classifyBug("nimadir buzildi").title).toBe("Boshqa xatolik");
  });
});

describe("friendlyBugLine", () => {
  it("foydalanuvchi uchun tushunarli ibora qaytaradi", () => {
    expect(friendlyBugLine("Failed to fetch")).toBe("tarmoq aloqasida");
  });

  it("stack ichidan ham aniqlaydi", () => {
    expect(friendlyBugLine("Xatolik", "at prisma.user.findMany")).toBe(
      "ma'lumotlar bilan ishlashda",
    );
  });
});
