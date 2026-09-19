import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseSessionDate,
  sessionCreateSchema,
} from "@/components/exams/session-schema";
import {
  getSessionFormOptions,
  getStaffSessions,
  getStudentSessions,
} from "@/components/exams/session-data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "STUDENT") {
    const sessions = await getStudentSessions(user.id);
    return Response.json({ ok: true, data: { role: user.role, sessions } });
  }

  const courseId = new URL(request.url).searchParams.get("courseId") ?? undefined;
  const [sessions, options] = await Promise.all([
    getStaffSessions({ id: user.id, role: user.role }, courseId),
    getSessionFormOptions({ id: user.id, role: user.role }),
  ]);
  return Response.json({
    ok: true,
    data: { role: user.role, sessions, ...options },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sessionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  const date = parseSessionDate(parsed.data.date);
  if (!date) {
    return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, teacherId: true },
  });
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (user.role === "TEACHER" && course.teacherId !== user.id) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.termId) {
    const term = await prisma.term.findUnique({
      where: { id: parsed.data.termId },
      select: { id: true },
    });
    if (!term) {
      return Response.json({ ok: false, error: "Semestr topilmadi" }, { status: 404 });
    }
  }

  try {
    const session = await prisma.examSession.create({
      data: {
        courseId: course.id,
        title: parsed.data.title,
        type: parsed.data.type,
        date,
        startTime: parsed.data.startTime ?? null,
        endTime: parsed.data.endTime ?? null,
        room: parsed.data.room ?? null,
        admissionOpen: parsed.data.admissionOpen ?? false,
        termId: parsed.data.termId ?? null,
      },
      select: { id: true },
    });
    return Response.json({ ok: true, data: { id: session.id } }, { status: 201 });
  } catch {
    return Response.json({ ok: false, error: "Sessiya yaratishda xatolik" }, { status: 500 });
  }
}
