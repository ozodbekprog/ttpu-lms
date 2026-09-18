import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const colorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  code: z.string().trim().max(20).nullable().optional(),
  color: colorSchema.optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return Response.json({ ok: false, error: "Fan topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Fan ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== subject.name) {
    const existing = await prisma.subject.findUnique({ where: { name: parsed.data.name } });
    if (existing) return Response.json({ ok: false, error: "Bu nomdagi fan mavjud" }, { status: 409 });
  }

  const updated = await prisma.subject.update({
    where: { id },
    data: {
      name: parsed.data.name,
      code: parsed.data.code === undefined ? undefined : parsed.data.code ? parsed.data.code : null,
      color: parsed.data.color,
    },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return Response.json({ ok: false, error: "Fan topilmadi" }, { status: 404 });

  await prisma.subject.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
