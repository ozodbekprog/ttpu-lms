import { describe, expect, it } from "vitest";
import { gpaPoints, letterGrade } from "@/app/api/gpa/data";
import type { GpaLetter } from "@/app/api/gpa/data";

describe("gpaPoints", () => {
  it.each([
    [100, 4],
    [95, 4],
    [90, 4],
    [89, 3.7],
    [85, 3.7],
    [84, 3.3],
    [80, 3.3],
    [79, 3],
    [75, 3],
    [74, 2.7],
    [70, 2.7],
    [69, 2.3],
    [65, 2.3],
    [64, 2],
    [60, 2],
    [59, 0],
    [30, 0],
    [0, 0],
  ])("foiz %i uchun GPA ball %s", (percent, expected) => {
    expect(gpaPoints(percent)).toBe(expected);
  });
});

describe("letterGrade", () => {
  it.each([
    [100, "A"],
    [90, "A"],
    [89, "B"],
    [80, "B"],
    [79, "C"],
    [70, "C"],
    [69, "D"],
    [60, "D"],
    [59, "F"],
    [0, "F"],
  ])("foiz %i uchun harf baho %s", (percent, expected) => {
    expect(letterGrade(percent)).toBe(expected);
  });

  it("barcha harflar GpaLetter tipiga mos keladi", () => {
    const letters: GpaLetter[] = [100, 85, 75, 65, 10].map((percent) => letterGrade(percent));
    expect(letters).toEqual(["A", "B", "C", "D", "F"]);
  });
});
