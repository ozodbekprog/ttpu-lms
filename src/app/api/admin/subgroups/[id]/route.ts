import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(20).optional(),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { error: Response.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const subGroup = await prisma.subGroup.findUnique({ where: { id } });
  if (!subGroup) return Response.json({ ok: false, error: "Kichik guruh topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success || !parsed.data.name) {
    return Response.json({ ok: false, error: "Kichik guruh nomini kiriting" }, { status: 400 });
  }

  const name = parsed.data.name;
  if (name !== subGroup.name) {
    const existing = await prisma.subGroup.findUnique({
      where: { groupId_name: { groupId: subGroup.groupId, name } },
    });
    if (existing) {
      return Response.json({ ok: false, error: "Bu nomdagi kichik guruh mavjud" }, { status: 409 });
    }
  }

  const updated = await prisma.subGroup.update({ where: { id }, data: { name } });
  return Response.json({ ok: true, data: { id: updated.id, name: updated.name } });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const subGroup = await prisma.subGroup.findUnique({ where: { id }, select: { id: true } });
  if (!subGroup) return Response.json({ ok: false, error: "Kichik guruh topilmadi" }, { status: 404 });

  await prisma.subGroup.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
