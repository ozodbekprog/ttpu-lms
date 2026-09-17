import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const updateSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(6).optional(),
  slot: z.number().int().min(1).max(8).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  teacher: z.string().trim().max(200).nullish(),
  room: z.string().trim().max(100).nullish(),
  parity: z.enum(["odd", "even"]).nullish(),
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

  const entry = await prisma.scheduleEntry.findUnique({ where: { id } });
  if (!entry) {
    return Response.json({ ok: false, error: "Jadval yozuvi topilmadi" }, { status: 404 });
  }

  const nextDayOfWeek = data.dayOfWeek ?? entry.dayOfWeek;
  const nextSlot = data.slot ?? entry.slot;
  const nextParity = data.parity === undefined ? entry.parity : data.parity;

  const conflict = await prisma.scheduleEntry.findFirst({
    where: {
      id: { not: id },
      groupId: entry.groupId,
      dayOfWeek: nextDayOfWeek,
      slot: nextSlot,
      OR: [{ parity: null }, { parity: nextParity }],
    },
    select: { id: true },
  });
  if (conflict) {
    return Response.json({ ok: false, error: "Bu vaqtda guruhda boshqa dars mavjud" }, { status: 409 });
  }

  const updated = await prisma.scheduleEntry.update({
    where: { id },
    data: {
      ...(data.dayOfWeek !== undefined ? { dayOfWeek: data.dayOfWeek } : {}),
      ...(data.slot !== undefined ? { slot: data.slot } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.teacher !== undefined ? { teacher: data.teacher ? data.teacher : null } : {}),
      ...(data.room !== undefined ? { room: data.room ? data.room : null } : {}),
      ...(data.parity !== undefined ? { parity: data.parity ?? null } : {}),
    },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const entry = await prisma.scheduleEntry.findUnique({ where: { id }, select: { id: true } });
  if (!entry) {
    return Response.json({ ok: false, error: "Jadval yozuvi topilmadi" }, { status: 404 });
  }

  await prisma.scheduleEntry.delete({ where: { id } });

  return Response.json({ ok: true, data: { id } });
}
