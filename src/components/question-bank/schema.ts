import { z } from "zod";
import { questionTypeSchema } from "@/components/quiz/schema";
import type { QuestionType } from "@/components/quiz/shared";

export const bankQuestionInputSchema = z.object({
  courseId: z.string().trim().min(1).nullable(),
  subjectId: z.string().trim().min(1).nullable(),
  text: z.string().trim().min(1, "Savol matnini kiriting").max(2000),
  type: questionTypeSchema,
  options: z.array(z.string().trim().min(1)).max(10),
  correct: z.array(z.number().int().min(0)).max(10),
  difficulty: z.number().int().min(1).max(3),
});

export function questionShapeError(input: {
  type: QuestionType;
  options: string[];
  correct: number[];
}): string | null {
  if (input.type === "TEXT") {
    if (input.options.length > 0 || input.correct.length > 0) {
      return "Matnli savolda variantlar bo'lmaydi";
    }
    return null;
  }
  if (input.options.length < 2) return "Kamida 2 ta variant kiriting";
  if (input.correct.some((index) => index >= input.options.length)) {
    return "To'g'ri variantlar noto'g'ri belgilangan";
  }
  if (input.type === "SINGLE" && input.correct.length !== 1) {
    return "Bitta to'g'ri variantni belgilang";
  }
  if (input.type === "MULTIPLE" && input.correct.length < 1) {
    return "Kamida bitta to'g'ri variantni belgilang";
  }
  return null;
}

export const bankQuestionCreateSchema = bankQuestionInputSchema.superRefine((value, ctx) => {
  if (!value.courseId && !value.subjectId) {
    ctx.addIssue({ code: "custom", message: "Kurs yoki fanni tanlang" });
  }
  const issue = questionShapeError(value);
  if (issue) ctx.addIssue({ code: "custom", message: issue });
});

export const bankQuestionUpdateSchema = bankQuestionInputSchema.partial();
