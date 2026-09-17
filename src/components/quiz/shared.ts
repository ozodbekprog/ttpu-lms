import type { Question } from "@prisma/client";

export type QuestionType = "SINGLE" | "MULTIPLE" | "TEXT";

export type AnswerValue = number | number[] | string;
export type QuizAnswers = Record<string, AnswerValue>;

export type QuestionFull = {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correct: number[];
  points: number;
  position: number;
};

export type QuestionPublic = Omit<QuestionFull, "correct">;

export type QuestionDraft = {
  text: string;
  type: QuestionType;
  options: string[];
  correct: number[];
  points: number;
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  SINGLE: "Bitta to'g'ri javob",
  MULTIPLE: "Bir nechta to'g'ri javob",
  TEXT: "Matnli javob (qo'lda)",
};

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number" && Number.isInteger(item));
}

export function asAnswers(value: unknown): QuizAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: QuizAnswers = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "number" || typeof item === "string") {
      result[key] = item;
    } else if (Array.isArray(item)) {
      result[key] = item.filter((entry): entry is number => typeof entry === "number");
    }
  }
  return result;
}

export function toQuestionFull(
  question: Pick<Question, "id" | "text" | "type" | "options" | "correct" | "points" | "position">,
): QuestionFull {
  return {
    id: question.id,
    text: question.text,
    type: question.type,
    options: asStringArray(question.options),
    correct: asNumberArray(question.correct),
    points: question.points,
    position: question.position,
  };
}

export function toQuestionPublic(question: QuestionFull): QuestionPublic {
  return {
    id: question.id,
    text: question.text,
    type: question.type,
    options: question.options,
    points: question.points,
    position: question.position,
  };
}

export function totalPoints(questions: Array<{ points: number }>): number {
  return questions.reduce((sum, question) => sum + question.points, 0);
}

export function hasTextQuestions(questions: Array<{ type: QuestionType }>): boolean {
  return questions.some((question) => question.type === "TEXT");
}

export function isAnswerCorrect(question: QuestionFull, answer: AnswerValue | undefined): boolean {
  if (question.type === "SINGLE") {
    return typeof answer === "number" && question.correct.length === 1 && answer === question.correct[0];
  }
  if (question.type === "MULTIPLE") {
    if (!Array.isArray(answer)) return false;
    const selected = [...new Set(answer)].sort((a, b) => a - b);
    const expected = [...new Set(question.correct)].sort((a, b) => a - b);
    return selected.length === expected.length && selected.every((value, index) => value === expected[index]);
  }
  return false;
}

export function autoScore(questions: QuestionFull[], answers: QuizAnswers): number {
  return questions.reduce((sum, question) => {
    return isAnswerCorrect(question, answers[question.id]) ? sum + question.points : sum;
  }, 0);
}

export function formatAnswer(question: QuestionFull, answer: AnswerValue | undefined): string {
  if (answer === undefined || answer === null) return "Javob berilmagan";
  if (question.type === "TEXT") {
    return typeof answer === "string" && answer.trim().length > 0 ? answer : "Javob berilmagan";
  }
  const indexes = typeof answer === "number" ? [answer] : Array.isArray(answer) ? answer : [];
  const labels = indexes
    .filter((index) => index >= 0 && index < question.options.length)
    .map((index) => question.options[index]);
  return labels.length > 0 ? labels.join(", ") : "Javob berilmagan";
}
