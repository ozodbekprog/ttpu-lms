import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const term = await prisma.term.findUnique({ where: { id } });
  if (!term) return Response.json({ ok: false, error: "Semestr topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Semestr ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const startDate = parsed.data.startDate ?? term.startDate;
  const endDate = parsed.data.endDate ?? term.endDate;
  if (endDate.getTime() <= startDate.getTime()) {
    return Response.json({ ok: false, error: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== term.name) {
    const existing = await prisma.term.findUnique({ where: { name: parsed.data.name } });
    if (existing) return Response.json({ ok: false, error: "Bu nomdagi semestr mavjud" }, { status: 409 });
  }

  const data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate;
  if (parsed.data.endDate !== undefined) data.endDate = parsed.data.endDate;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const include = { _count: { select: { sessions: true } } };
  const updated = parsed.data.isActive
    ? await prisma.$transaction(async (tx) => {
        await tx.term.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } });
        return tx.term.update({ where: { id }, data, include });
      })
    : await prisma.term.update({ where: { id }, data, include });

  const { _count, ...rest } = updated;
  return Response.json({ ok: true, data: { ...rest, sessionsCount: _count.sessions } });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const term = await prisma.term.findUnique({ where: { id } });
  if (!term) return Response.json({ ok: false, error: "Semestr topilmadi" }, { status: 404 });

  await prisma.term.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
