import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  isPublished: z.boolean().optional(),
  teacherId: z.string().trim().min(1).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }

  if (parsed.data.teacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: parsed.data.teacherId } });
    if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
      return Response.json({ ok: false, error: "O'qituvchi topilmadi" }, { status: 400 });
    }
  }

  const updated = await prisma.course.update({
    where: { id },
    data: {
      isPublished: parsed.data.isPublished,
      teacherId: parsed.data.teacherId,
    },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });

  await prisma.course.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
