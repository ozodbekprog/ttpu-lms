import { z } from "zod";
import { SESSION_TYPES, SHEET_STATUSES } from "./session-shared";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeField = z
  .string()
  .trim()
  .regex(TIME_PATTERN, "Vaqt formati HH:MM bo'lishi kerak")
  .nullable()
  .optional();

export const sessionCreateSchema = z.object({
  courseId: z.string().trim().min(1, "Kurs tanlanmagan"),
  title: z.string().trim().min(2, "Sarlavha juda qisqa").max(200),
  type: z.enum(SESSION_TYPES),
  date: z.string().trim().regex(DATE_PATTERN, "Sana formati noto'g'ri"),
  startTime: timeField,
  endTime: timeField,
  room: z.string().trim().max(100).nullable().optional(),
  admissionOpen: z.boolean().optional(),
  termId: z.string().trim().min(1).nullable().optional(),
});

export const sessionUpdateSchema = sessionCreateSchema
  .omit({ courseId: true })
  .partial();

export const sheetsCreateSchema = z.object({
  force: z.boolean().optional(),
  studentIds: z.array(z.string().trim().min(1)).max(500).optional(),
});

export const sheetUpdateSchema = z.object({
  seat: z.string().trim().max(20).nullable().optional(),
  status: z.enum(SHEET_STATUSES).optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
});

export function parseSessionDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
