import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  year: z.number().int().min(2000).max(2100).nullable().optional(),
  curatorId: z.string().trim().min(1).nullable().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== group.name) {
    const existing = await prisma.group.findUnique({ where: { name: parsed.data.name } });
    if (existing) return Response.json({ ok: false, error: "Bu nomdagi guruh mavjud" }, { status: 409 });
  }

  if (parsed.data.curatorId) {
    const curator = await prisma.user.findUnique({ where: { id: parsed.data.curatorId } });
    if (!curator) return Response.json({ ok: false, error: "Kurator topilmadi" }, { status: 400 });
  }

  const updated = await prisma.group.update({
    where: { id },
    data: {
      name: parsed.data.name,
      year: parsed.data.year === undefined ? undefined : parsed.data.year,
      curator:
        parsed.data.curatorId === undefined
          ? undefined
          : parsed.data.curatorId
            ? { connect: { id: parsed.data.curatorId } }
            : { disconnect: true },
    },
    include: { _count: { select: { users: true } } },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  if (group._count.users > 0) {
    return Response.json(
      { ok: false, error: "Guruhda foydalanuvchilar bor, avval ularni boshqa guruhga o'tkazing" },
      { status: 409 },
    );
  }

  await prisma.group.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
