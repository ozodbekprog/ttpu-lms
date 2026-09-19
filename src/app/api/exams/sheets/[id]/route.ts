import { getCurrentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sheetUpdateSchema } from "@/components/exams/session-schema";
import { canManageSession } from "@/components/exams/session-data";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(user.role)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const sheet = await prisma.examSheet.findUnique({
    where: { id },
    select: {
      id: true,
      session: { select: { course: { select: { teacherId: true } } } },
    },
  });
  if (!sheet) {
    return Response.json({ ok: false, error: "Imtihon varaqasi topilmadi" }, { status: 404 });
  }
  if (!canManageSession({ id: user.id, role: user.role }, sheet.session.course.teacherId)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sheetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.examSheet.update({
      where: { id },
      data: {
        ...(parsed.data.seat !== undefined ? { seat: parsed.data.seat } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.score !== undefined ? { score: parsed.data.score } : {}),
      },
      select: { id: true, seat: true, status: true, score: true },
    });
    return Response.json({ ok: true, data: updated });
  } catch {
    return Response.json({ ok: false, error: "Saqlashda xatolik" }, { status: 500 });
  }
}
