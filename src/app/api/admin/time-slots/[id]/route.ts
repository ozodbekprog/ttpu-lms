import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const patchSchema = z.object({
  slot: z.number().int().min(1).max(20).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const timeSlot = await prisma.timeSlot.findUnique({ where: { id } });
  if (!timeSlot) return Response.json({ ok: false, error: "Dars vaqti topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dars vaqti ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  if (parsed.data.slot !== undefined && parsed.data.slot !== timeSlot.slot) {
    const existing = await prisma.timeSlot.findUnique({ where: { slot: parsed.data.slot } });
    if (existing) {
      return Response.json({ ok: false, error: "Bu raqamli dars vaqti mavjud" }, { status: 409 });
    }
  }

  const updated = await prisma.timeSlot.update({
    where: { id },
    data: {
      slot: parsed.data.slot,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const timeSlot = await prisma.timeSlot.findUnique({ where: { id } });
  if (!timeSlot) return Response.json({ ok: false, error: "Dars vaqti topilmadi" }, { status: 404 });

  await prisma.timeSlot.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
