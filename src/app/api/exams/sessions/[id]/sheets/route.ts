import { getCurrentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attendanceCounts } from "@/app/api/attendance/summary/data";
import { sheetsCreateSchema } from "@/components/exams/session-schema";
import {
  canManageSession,
  getSessionSheetRows,
} from "@/components/exams/session-data";
import type { AttendanceStatus } from "@prisma/client";

async function findSessionForStaff(id: string) {
  return prisma.examSession.findUnique({
    where: { id },
    select: { id: true, courseId: true, course: { select: { teacherId: true } } },
  });
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(user.role)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const session = await findSessionForStaff(id);
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageSession({ id: user.id, role: user.role }, session.course.teacherId)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const data = await getSessionSheetRows(id);
  if (!data) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  return Response.json({ ok: true, data });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(user.role)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const session = await findSessionForStaff(id);
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageSession({ id: user.id, role: user.role }, session.course.teacherId)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sheetsCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" },
      { status: 400 },
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: session.courseId },
    select: { userId: true },
  });

  const requested = parsed.data.studentIds;
  const targets = enrollments
    .map((enrollment) => enrollment.userId)
    .filter((studentId) => !requested || requested.includes(studentId));

  const [records, sheets] = await Promise.all([
    prisma.attendance.findMany({
      where: { courseId: session.courseId, studentId: { in: targets } },
      select: { studentId: true, status: true },
    }),
    prisma.examSheet.findMany({
      where: { sessionId: id, studentId: { in: targets } },
      select: { studentId: true },
    }),
  ]);

  const byStudent = new Map<string, AttendanceStatus[]>();
  for (const record of records) {
    const list = byStudent.get(record.studentId);
    if (list) list.push(record.status);
    else byStudent.set(record.studentId, [record.status]);
  }
  const existing = new Set(sheets.map((sheet) => sheet.studentId));

  const toCreate: string[] = [];
  let ineligible = 0;
  for (const studentId of targets) {
    if (existing.has(studentId)) continue;
    const counted = attendanceCounts(byStudent.get(studentId) ?? []);
    if (parsed.data.force === true || counted.eligible) {
      toCreate.push(studentId);
    } else {
      ineligible += 1;
    }
  }

  try {
    if (toCreate.length > 0) {
      await prisma.examSheet.createMany({
        data: toCreate.map((studentId) => ({ sessionId: id, studentId })),
      });
    }
    return Response.json({
      ok: true,
      data: {
        created: toCreate.length,
        skipped: sheets.length,
        ineligible,
        total: targets.length,
      },
    });
  } catch {
    return Response.json({ ok: false, error: "Ro'yxat shakllantirishda xatolik" }, { status: 500 });
  }
}
