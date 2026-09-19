import { getCurrentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseSessionDate,
  sessionUpdateSchema,
} from "@/components/exams/session-schema";
import {
  canManageSession,
  getSessionById,
  getStudentSessionView,
} from "@/components/exams/session-data";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const session = await getSessionById(id);
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }

  if (canManageSession({ id: user.id, role: user.role }, session.course.teacherId)) {
    return Response.json({ ok: true, data: session });
  }
  if (user.role === "STUDENT") {
    const view = await getStudentSessionView(id, user.id);
    if (!view) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    return Response.json({ ok: true, data: view });
  }
  return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(user.role)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const session = await prisma.examSession.findUnique({
    where: { id },
    select: { id: true, course: { select: { teacherId: true } } },
  });
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageSession({ id: user.id, role: user.role }, session.course.teacherId)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sessionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  const data: {
    title?: string;
    type?: string;
    date?: Date;
    startTime?: string | null;
    endTime?: string | null;
    room?: string | null;
    admissionOpen?: boolean;
    termId?: string | null;
  } = {};

  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.type !== undefined) data.type = parsed.data.type;
  if (parsed.data.date !== undefined) {
    const date = parseSessionDate(parsed.data.date);
    if (!date) {
      return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
    }
    data.date = date;
  }
  if (parsed.data.startTime !== undefined) data.startTime = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) data.endTime = parsed.data.endTime;
  if (parsed.data.room !== undefined) data.room = parsed.data.room;
  if (parsed.data.admissionOpen !== undefined) data.admissionOpen = parsed.data.admissionOpen;
  if (parsed.data.termId !== undefined) {
    if (parsed.data.termId) {
      const term = await prisma.term.findUnique({
        where: { id: parsed.data.termId },
        select: { id: true },
      });
      if (!term) {
        return Response.json({ ok: false, error: "Semestr topilmadi" }, { status: 404 });
      }
    }
    data.termId = parsed.data.termId;
  }

  try {
    const updated = await prisma.examSession.update({
      where: { id },
      data,
      select: { id: true },
    });
    return Response.json({ ok: true, data: { id: updated.id } });
  } catch {
    return Response.json({ ok: false, error: "Saqlashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(user.role)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const session = await prisma.examSession.findUnique({
    where: { id },
    select: { id: true, course: { select: { teacherId: true } } },
  });
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageSession({ id: user.id, role: user.role }, session.course.teacherId)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.examSession.delete({ where: { id } });
    return Response.json({ ok: true, data: { id } });
  } catch {
    return Response.json({ ok: false, error: "O'chirishda xatolik" }, { status: 500 });
  }
}
