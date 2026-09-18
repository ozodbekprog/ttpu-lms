import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: z.enum(["SEMESTER", "HOLIDAY", "EXAM", "EVENT"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullish(),
  description: z.string().trim().max(500).nullish(),
});

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return { user: null, error: Response.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar noto'g'ri to'ldirilgan" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.academicEvent.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Tadbir topilmadi" }, { status: 404 });
  }

  const nextStart = data.startDate ?? existing.startDate;
  const nextEnd = data.endDate === undefined ? existing.endDate : data.endDate ?? null;
  if (nextEnd && nextEnd < nextStart) {
    return Response.json({ ok: false, error: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak" }, { status: 400 });
  }

  const event = await prisma.academicEvent.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: nextEnd } : {}),
      ...(data.description !== undefined ? { description: data.description ? data.description : null } : {}),
    },
  });

  return Response.json({ ok: true, data: event });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const existing = await prisma.academicEvent.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return Response.json({ ok: false, error: "Tadbir topilmadi" }, { status: 404 });
  }

  await prisma.academicEvent.delete({ where: { id } });

  return Response.json({ ok: true, data: { id } });
}
