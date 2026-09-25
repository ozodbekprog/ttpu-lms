import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { ru } from "@/i18n/ru";
import { uz } from "@/i18n/uz";

const dictionaries = { uz, ru, en };

describe("i18n dictionaries", () => {
  it("barcha tillarda bir xil kalitlar to'plamiga ega", () => {
    const reference = Object.keys(uz).sort();
    for (const locale of ["ru", "en"] as const) {
      expect(Object.keys(dictionaries[locale]).sort(), locale).toEqual(reference);
    }
  });

  it.each(["uz", "ru", "en"] as const)("%s lug'atidagi barcha qiymatlar to'ldirilgan", (locale) => {
    for (const [key, value] of Object.entries(dictionaries[locale])) {
      expect(value.trim(), `${locale}.${key}`).not.toBe("");
    }
  });
});
