import { z } from "zod";

export const questionTypeSchema = z.enum(["SINGLE", "MULTIPLE", "TEXT"]);

export const questionInputSchema = z
  .object({
    text: z.string().trim().min(1, "Savol matnini kiriting").max(2000),
    type: questionTypeSchema,
    options: z.array(z.string().trim().min(1)).max(10),
    correct: z.array(z.number().int().min(0)).max(10),
    points: z.number().int().min(1).max(100),
  })
  .superRefine((value, ctx) => {
    if (value.type === "SINGLE") {
      if (value.options.length < 2) {
        ctx.addIssue({ code: "custom", message: "Kamida 2 ta variant kiriting" });
      }
      if (value.correct.length !== 1 || value.correct[0] >= value.options.length) {
        ctx.addIssue({ code: "custom", message: "Bitta to'g'ri variantni belgilang" });
      }
    }
    if (value.type === "MULTIPLE") {
      if (value.options.length < 2) {
        ctx.addIssue({ code: "custom", message: "Kamida 2 ta variant kiriting" });
      }
      if (value.correct.length < 1) {
        ctx.addIssue({ code: "custom", message: "Kamida bitta to'g'ri variantni belgilang" });
      }
      if (value.correct.some((index) => index >= value.options.length)) {
        ctx.addIssue({ code: "custom", message: "To'g'ri variantlar noto'g'ri belgilangan" });
      }
    }
    if (value.type === "TEXT" && (value.options.length > 0 || value.correct.length > 0)) {
      ctx.addIssue({ code: "custom", message: "Matnli savolda variantlar bo'lmaydi" });
    }
  });

export const answerValueSchema = z.union([
  z.number().int().min(0),
  z.array(z.number().int().min(0)).max(20),
  z.string().max(5000),
]);

export const answersSchema = z.record(z.string(), answerValueSchema);

export const quizMetaSchema = z.object({
  title: z.string().trim().min(1, "Test nomini kiriting").max(200),
  description: z.string().trim().max(2000).nullable(),
  courseId: z.string().min(1, "Kursni tanlang"),
  timeLimitMin: z.number().int().min(1).max(600).nullable(),
  maxAttempts: z.number().int().min(1).max(50),
  isPublished: z.boolean(),
});

export const quizCreateSchema = quizMetaSchema.extend({
  questions: z.array(questionInputSchema).max(100).optional(),
});

export const quizUpdateSchema = quizMetaSchema.partial();

export const attemptPatchSchema = z.object({
  answers: answersSchema.optional(),
  score: z.number().int().min(0).optional(),
});
