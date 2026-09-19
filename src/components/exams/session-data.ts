import "server-only";
import { prisma } from "@/lib/prisma";
import { attendanceCounts } from "@/app/api/attendance/summary/data";
import type { AttendanceStatus, Role } from "@prisma/client";
import type {
  SessionSheetRow,
  StaffSessionItem,
  StudentSessionItem,
} from "./session-shared";

export * from "./session-shared";

export function canManageSession(user: { id: string; role: Role }, teacherId: string) {
  if (user.role === "ADMIN") return true;
  return user.role === "TEACHER" && user.id === teacherId;
}

export async function getCourseAttendanceMap(courseId: string, studentIds: string[]) {
  const byStudent = new Map<string, AttendanceStatus[]>();
  if (studentIds.length === 0) return byStudent;
  const records = await prisma.attendance.findMany({
    where: { courseId, studentId: { in: studentIds } },
    select: { studentId: true, status: true },
  });
  for (const record of records) {
    const list = byStudent.get(record.studentId);
    if (list) list.push(record.status);
    else byStudent.set(record.studentId, [record.status]);
  }
  return byStudent;
}

async function getEligibleByCourse(courseIds: string[]) {
  const result = new Map<string, number>();
  if (courseIds.length === 0) return result;
  const [enrollments, records] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { courseId: true, userId: true },
    }),
    prisma.attendance.findMany({
      where: { courseId: { in: courseIds } },
      select: { courseId: true, studentId: true, status: true },
    }),
  ]);
  const byStudent = new Map<string, AttendanceStatus[]>();
  for (const record of records) {
    const key = `${record.courseId}:${record.studentId}`;
    const list = byStudent.get(key);
    if (list) list.push(record.status);
    else byStudent.set(key, [record.status]);
  }
  for (const enrollment of enrollments) {
    const counted = attendanceCounts(
      byStudent.get(`${enrollment.courseId}:${enrollment.userId}`) ?? [],
    );
    if (counted.eligible) {
      result.set(enrollment.courseId, (result.get(enrollment.courseId) ?? 0) + 1);
    }
  }
  return result;
}

export async function getStaffSessions(
  user: { id: string; role: Role },
  courseId?: string,
): Promise<StaffSessionItem[]> {
  const sessions = await prisma.examSession.findMany({
    where: {
      ...(user.role === "TEACHER" ? { course: { teacherId: user.id } } : {}),
      ...(courseId ? { courseId } : {}),
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      course: { select: { id: true, title: true, slug: true } },
      term: { select: { name: true } },
      sheets: { select: { status: true } },
    },
  });

  const eligibleByCourse = await getEligibleByCourse([
    ...new Set(sessions.map((session) => session.courseId)),
  ]);

  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    type: session.type,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room,
    admissionOpen: session.admissionOpen,
    termName: session.term?.name ?? null,
    course: session.course,
    sheetCount: session.sheets.length,
    eligibleCount: eligibleByCourse.get(session.courseId) ?? 0,
    passedCount: session.sheets.filter((sheet) => sheet.status === "PASSED").length,
    failedCount: session.sheets.filter((sheet) => sheet.status === "FAILED").length,
    absentCount: session.sheets.filter((sheet) => sheet.status === "ABSENT").length,
    pendingCount: session.sheets.filter((sheet) => sheet.status === "PENDING").length,
  }));
}

export async function getStudentSessions(studentId: string): Promise<StudentSessionItem[]> {
  const sessions = await prisma.examSession.findMany({
    where: { course: { enrollments: { some: { userId: studentId } } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      course: { select: { id: true, title: true, slug: true } },
      sheets: {
        where: { studentId },
        select: { id: true, seat: true, status: true, score: true },
      },
    },
  });

  const courseIds = [...new Set(sessions.map((session) => session.courseId))];
  const records =
    courseIds.length > 0
      ? await prisma.attendance.findMany({
          where: { studentId, courseId: { in: courseIds } },
          select: { courseId: true, status: true },
        })
      : [];
  const byCourse = new Map<string, AttendanceStatus[]>();
  for (const record of records) {
    const list = byCourse.get(record.courseId);
    if (list) list.push(record.status);
    else byCourse.set(record.courseId, [record.status]);
  }

  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    type: session.type,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room,
    admissionOpen: session.admissionOpen,
    course: session.course,
    sheet: session.sheets[0] ?? null,
    attendance: attendanceCounts(byCourse.get(session.courseId) ?? []),
  }));
}

export async function getSessionById(id: string) {
  return prisma.examSession.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          teacherId: true,
          teacher: { select: { name: true } },
        },
      },
      term: { select: { id: true, name: true } },
    },
  });
}

export type SessionDetail = NonNullable<Awaited<ReturnType<typeof getSessionById>>>;

export async function getSessionFormOptions(user: { id: string; role: Role }) {
  const [courses, terms] = await Promise.all([
    prisma.course.findMany({
      where: user.role === "TEACHER" ? { teacherId: user.id } : {},
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.term.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, isActive: true },
    }),
  ]);
  return { courses, terms };
}

export async function getSessionSheetRows(
  sessionId: string,
): Promise<{ session: SessionDetail; rows: SessionSheetRow[] } | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const [enrollments, sheets] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: session.courseId },
      orderBy: { createdAt: "asc" },
      select: {
        userId: true,
        user: {
          select: { id: true, name: true, group: { select: { name: true } } },
        },
      },
    }),
    prisma.examSheet.findMany({
      where: { sessionId },
      select: { id: true, studentId: true, seat: true, status: true, score: true },
    }),
  ]);

  const attendance = await getCourseAttendanceMap(
    session.courseId,
    enrollments.map((enrollment) => enrollment.userId),
  );
  const sheetByStudent = new Map(sheets.map((sheet) => [sheet.studentId, sheet]));

  const rows: SessionSheetRow[] = enrollments.map((enrollment) => {
    const sheet = sheetByStudent.get(enrollment.userId);
    return {
      studentId: enrollment.userId,
      studentName: enrollment.user.name,
      studentGroup: enrollment.user.group?.name ?? null,
      sheetId: sheet?.id ?? null,
      seat: sheet?.seat ?? null,
      status: sheet?.status ?? "PENDING",
      score: sheet?.score ?? null,
      attendance: attendanceCounts(attendance.get(enrollment.userId) ?? []),
      admitted: Boolean(sheet),
    };
  });

  return { session, rows };
}

export async function getStudentSessionView(sessionId: string, studentId: string) {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: session.courseId, userId: studentId } },
    select: { id: true },
  });
  if (!enrollment) return null;

  const [attendance, sheet] = await Promise.all([
    getCourseAttendanceMap(session.courseId, [studentId]),
    prisma.examSheet.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
      select: { id: true, seat: true, status: true, score: true },
    }),
  ]);

  return {
    session,
    sheet,
    attendance: attendanceCounts(attendance.get(studentId) ?? []),
  };
}
