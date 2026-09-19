import { describe, expect, it } from "vitest";
import { autoScore, totalPoints } from "@/components/quiz/shared";
import type { QuestionFull, QuizAnswers } from "@/components/quiz/shared";

function question(overrides: Partial<QuestionFull> & Pick<QuestionFull, "id" | "type">): QuestionFull {
  return {
    text: "",
    options: [],
    correct: [],
    points: 1,
    position: 1,
    ...overrides,
  };
}

const single = question({
  id: "single",
  type: "SINGLE",
  options: ["A", "B", "C"],
  correct: [1],
  points: 2,
});

const multiple = question({
  id: "multiple",
  type: "MULTIPLE",
  options: ["A", "B", "C", "D"],
  correct: [0, 2],
  points: 3,
});

const text = question({ id: "text", type: "TEXT", points: 5 });

describe("autoScore: SINGLE", () => {
  it("to'g'ri variant ball oladi", () => {
    expect(autoScore([single], { single: 1 })).toBe(2);
  });

  it("xato, satrli va yo'q javob ball olmaydi", () => {
    expect(autoScore([single], { single: 0 })).toBe(0);
    expect(autoScore([single], { single: "1" })).toBe(0);
    expect(autoScore([single], {})).toBe(0);
  });

  it("bir nechta variantli massiv SINGLE uchun hisoblanmaydi", () => {
    expect(autoScore([single], { single: [1] })).toBe(0);
  });
});

describe("autoScore: MULTIPLE", () => {
  it("to'liq mos javob ball oladi", () => {
    expect(autoScore([multiple], { multiple: [0, 2] })).toBe(3);
    expect(autoScore([multiple], { multiple: [2, 0] })).toBe(3);
  });

  it("takrorlangan variantlar to'g'ri javobni buzmaydi", () => {
    expect(autoScore([multiple], { multiple: [0, 2, 0, 2] })).toBe(3);
  });

  it("qisman mos javob ball olmaydi", () => {
    expect(autoScore([multiple], { multiple: [0] })).toBe(0);
    expect(autoScore([multiple], { multiple: [2] })).toBe(0);
  });

  it("ortiqcha variant qo'shilsa ball olmaydi", () => {
    expect(autoScore([multiple], { multiple: [0, 2, 3] })).toBe(0);
  });

  it("bo'sh massiv va massiv bo'lmagan javob ball olmaydi", () => {
    expect(autoScore([multiple], { multiple: [] })).toBe(0);
    expect(autoScore([multiple], { multiple: 0 })).toBe(0);
  });
});

describe("autoScore: TEXT va aralash to'plam", () => {
  it("matnli javob avtomatik baholashda 0 hissa qo'shadi", () => {
    expect(autoScore([text], { text: "to'g'ri javob" })).toBe(0);
    expect(autoScore([text], {})).toBe(0);
  });

  it("aralash to'plamda faqat avtomatik tekshiriladigan ballar yig'iladi", () => {
    const questions = [single, multiple, text];
    const answers: QuizAnswers = { single: 1, multiple: [2, 0], text: "izoh" };
    expect(autoScore(questions, answers)).toBe(5);
  });

  it("barcha javoblar xato bo'lsa yakuniy ball 0", () => {
    const answers: QuizAnswers = { single: 2, multiple: [1], text: "izoh" };
    expect(autoScore([single, multiple, text], answers)).toBe(0);
  });

  it("totalPoints barcha savollar ballini qo'shadi", () => {
    expect(totalPoints([single, multiple, text])).toBe(10);
  });
});
