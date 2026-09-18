import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  building: z.string().trim().max(80).nullable().optional(),
  capacity: z.number().int().min(0).max(10000).nullable().optional(),
  equipment: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return Response.json({ ok: false, error: "Xona topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== room.name) {
    const existing = await prisma.room.findUnique({ where: { name: parsed.data.name } });
    if (existing) return Response.json({ ok: false, error: "Bu nomdagi xona mavjud" }, { status: 409 });
  }

  const updated = await prisma.room.update({
    where: { id },
    data: {
      name: parsed.data.name,
      building: parsed.data.building === undefined ? undefined : parsed.data.building,
      capacity: parsed.data.capacity === undefined ? undefined : parsed.data.capacity,
      equipment: parsed.data.equipment === undefined ? undefined : parsed.data.equipment,
    },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return Response.json({ ok: false, error: "Xona topilmadi" }, { status: 404 });

  await prisma.room.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
