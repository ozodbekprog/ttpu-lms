import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const colorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  color: colorSchema.optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const lessonType = await prisma.lessonType.findUnique({ where: { id } });
  if (!lessonType) return Response.json({ ok: false, error: "Dars turi topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dars turi ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== lessonType.name) {
    const existing = await prisma.lessonType.findUnique({ where: { name: parsed.data.name } });
    if (existing) return Response.json({ ok: false, error: "Bu nomdagi dars turi mavjud" }, { status: 409 });
  }

  const updated = await prisma.lessonType.update({
    where: { id },
    data: { name: parsed.data.name, color: parsed.data.color },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const lessonType = await prisma.lessonType.findUnique({ where: { id } });
  if (!lessonType) return Response.json({ ok: false, error: "Dars turi topilmadi" }, { status: 404 });

  await prisma.lessonType.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
