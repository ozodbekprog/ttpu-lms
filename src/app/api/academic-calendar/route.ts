import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    type: z.enum(["SEMESTER", "HOLIDAY", "EXAM", "EVENT"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullish(),
    description: z.string().trim().max(500).nullish(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak",
  });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.academicEvent.findMany({ orderBy: { startDate: "asc" } });

  return Response.json({ ok: true, data: { events } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar noto'g'ri to'ldirilgan" }, { status: 400 });
  }
  const data = parsed.data;

  const event = await prisma.academicEvent.create({
    data: {
      title: data.title,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      description: data.description ? data.description : null,
    },
  });

  return Response.json({ ok: true, data: event }, { status: 201 });
}
