import "server-only";
import { prisma } from "@/lib/prisma";
import type { AttendanceStatus, Role } from "@prisma/client";
import {
  attendanceCounts,
  EXAM_MIN_PERCENT,
  type AttendanceCounts,
} from "@/app/api/attendance/summary/data";
import { GPA_CREDITS, gpaPoints } from "@/app/api/gpa/data";

export type CuratorStudent = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  attendance: AttendanceCounts;
  assignmentAverage: number | null;
  quizAverage: number | null;
  gpa: number | null;
  problematic: boolean;
};

export type StudentMetrics = Omit<CuratorStudent, "id" | "name" | "email" | "avatarUrl">;

export type CuratorGroupSummary = {
  id: string;
  name: string;
  year: number | null;
  curator: { id: string; name: string } | null;
  studentCount: number;
  averageAttendance: number | null;
  lowAttendanceCount: number;
  averageGpa: number | null;
};

export type CuratorGroupDetail = CuratorGroupSummary & { students: CuratorStudent[] };

export type CuratorReport = {
  group: { id: string; name: string };
  week: { start: string; end: string };
  weekly: AttendanceCounts;
  averageAttendance: number | null;
  averageGpa: number | null;
  problematic: CuratorStudent[];
  text: string;
};

export type CuratorGroupOption = {
  id: string;
  name: string;
  year: number | null;
  curator: { id: string; name: string } | null;
};

type ScoreTotals = { score: number; max: number };

function addCourseScore(
  totals: Map<string, ScoreTotals>,
  courseId: string,
  score: number,
  max: number,
) {
  if (max <= 0) return;
  const current = totals.get(courseId) ?? { score: 0, max: 0 };
  current.score += score;
  current.max += max;
  totals.set(courseId, current);
}

function addScore(totals: ScoreTotals, score: number, max: number) {
  totals.score += score;
  totals.max += max;
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function percentOf(totals: ScoreTotals) {
  if (totals.max <= 0) return null;
  return Math.round((totals.score / totals.max) * 100);
}

function gpaOf(courses: Map<string, ScoreTotals>) {
  let qualityPoints = 0;
  let credits = 0;
  for (const totals of courses.values()) {
    if (totals.max <= 0) continue;
    qualityPoints += gpaPoints(Math.round((totals.score / totals.max) * 100)) * GPA_CREDITS;
    credits += GPA_CREDITS;
  }
  if (credits <= 0) return null;
  return roundTwo(qualityPoints / credits);
}

function emptyMetrics(): StudentMetrics {
  return {
    attendance: attendanceCounts([]),
    assignmentAverage: null,
    quizAverage: null,
    gpa: null,
    problematic: true,
  };
}

async function loadStudentMetrics(studentIds: string[]): Promise<Map<string, StudentMetrics>> {
  const metrics = new Map<string, StudentMetrics>();
  for (const id of studentIds) metrics.set(id, emptyMetrics());
  if (studentIds.length === 0) return metrics;

  const [attendance, submissions, attempts] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, status: true },
    }),
    prisma.submission.findMany({
      where: { studentId: { in: studentIds }, status: "GRADED", score: { not: null } },
      select: {
        studentId: true,
        score: true,
        assignment: { select: { courseId: true, maxScore: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: { in: studentIds }, finishedAt: { not: null }, score: { not: null } },
      select: {
        studentId: true,
        score: true,
        quiz: { select: { courseId: true, questions: { select: { points: true } } } },
      },
    }),
  ]);

  const statuses = new Map<string, AttendanceStatus[]>();
  for (const record of attendance) {
    const list = statuses.get(record.studentId);
    if (list) {
      list.push(record.status);
    } else {
      statuses.set(record.studentId, [record.status]);
    }
  }

  const courses = new Map<string, Map<string, ScoreTotals>>();
  const assignments = new Map<string, ScoreTotals>();
  const quizzes = new Map<string, ScoreTotals>();

  for (const submission of submissions) {
    const maxScore = submission.assignment.maxScore;
    let byCourse = courses.get(submission.studentId);
    if (!byCourse) {
      byCourse = new Map();
      courses.set(submission.studentId, byCourse);
    }
    addCourseScore(byCourse, submission.assignment.courseId, submission.score ?? 0, maxScore);
    if (maxScore > 0) {
      const totals = assignments.get(submission.studentId) ?? { score: 0, max: 0 };
      addScore(totals, submission.score ?? 0, maxScore);
      assignments.set(submission.studentId, totals);
    }
  }

  for (const attempt of attempts) {
    const quizMax = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
    if (quizMax <= 0) continue;
    let byCourse = courses.get(attempt.studentId);
    if (!byCourse) {
      byCourse = new Map();
      courses.set(attempt.studentId, byCourse);
    }
    addCourseScore(byCourse, attempt.quiz.courseId, attempt.score ?? 0, quizMax);
    const totals = quizzes.get(attempt.studentId) ?? { score: 0, max: 0 };
    addScore(totals, attempt.score ?? 0, quizMax);
    quizzes.set(attempt.studentId, totals);
  }

  for (const id of studentIds) {
    const summary = attendanceCounts(statuses.get(id) ?? []);
    const gpa = gpaOf(courses.get(id) ?? new Map<string, ScoreTotals>());
    const assignmentAverage = percentOf(assignments.get(id) ?? { score: 0, max: 0 });
    const quizAverage = percentOf(quizzes.get(id) ?? { score: 0, max: 0 });
    metrics.set(id, {
      attendance: summary,
      assignmentAverage,
      quizAverage,
      gpa,
      problematic: summary.percent < EXAM_MIN_PERCENT || (gpa !== null && gpa < 2),
    });
  }

  return metrics;
}

function summarize(group: CuratorGroupOption, metrics: StudentMetrics[]): CuratorGroupSummary {
  const graded = metrics.filter((item) => item.attendance.total > 0);
  const averageAttendance =
    graded.length > 0
      ? Math.round(graded.reduce((sum, item) => sum + item.attendance.percent, 0) / graded.length)
      : null;

  const withGpa = metrics.filter((item) => item.gpa !== null);
  const averageGpa =
    withGpa.length > 0
      ? roundTwo(withGpa.reduce((sum, item) => sum + (item.gpa ?? 0), 0) / withGpa.length)
      : null;

  return {
    id: group.id,
    name: group.name,
    year: group.year,
    curator: group.curator,
    studentCount: metrics.length,
    averageAttendance,
    lowAttendanceCount: metrics.filter((item) => !item.attendance.eligible).length,
    averageGpa,
  };
}

export async function getCuratorGroups(
  user: { id: string; role: Role },
  groupId?: string | null,
): Promise<CuratorGroupOption[]> {
  return prisma.group.findMany({
    where: {
      ...(user.role === "ADMIN" ? {} : { curatorId: user.id }),
      ...(groupId ? { id: groupId } : {}),
    },
    select: {
      id: true,
      name: true,
      year: true,
      curator: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function buildGroupSummaries(
  groups: CuratorGroupOption[],
): Promise<CuratorGroupSummary[]> {
  const groupIds = groups.map((group) => group.id);
  const students =
    groupIds.length > 0
      ? await prisma.user.findMany({
          where: { groupId: { in: groupIds }, role: "STUDENT" },
          select: { id: true, groupId: true },
        })
      : [];
  const metrics = await loadStudentMetrics(students.map((student) => student.id));

  return groups.map((group) =>
    summarize(
      group,
      students
        .filter((student) => student.groupId === group.id)
        .map((student) => metrics.get(student.id) ?? emptyMetrics()),
    ),
  );
}

export async function buildGroupDetail(groupId: string): Promise<CuratorGroupDetail | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      year: true,
      curator: { select: { id: true, name: true } },
    },
  });
  if (!group) return null;

  const students = await prisma.user.findMany({
    where: { groupId, role: "STUDENT" },
    select: { id: true, name: true, email: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });
  const metrics = await loadStudentMetrics(students.map((student) => student.id));

  const rows: CuratorStudent[] = students.map((student) => ({
    ...student,
    ...(metrics.get(student.id) ?? emptyMetrics()),
  }));

  return { ...summarize(group, rows), students: rows };
}

export function parseWeekStart(value?: string | null) {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  const base = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const diff = (base.getDay() + 6) % 7;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() - diff);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDay(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function percentText(value: number | null) {
  return value !== null ? `${value}%` : "—";
}

function composeReportText(
  detail: CuratorGroupDetail,
  week: { start: Date; end: Date },
  weekly: AttendanceCounts,
  problematic: CuratorStudent[],
) {
  const lines = [
    `${detail.name} — haftalik hisobot`,
    `Davr: ${formatDay(week.start)} — ${formatDay(week.end)}`,
    "",
    `Talabalar: ${detail.studentCount}`,
  ];

  if (weekly.total > 0) {
    lines.push(
      `Haftalik davomat: ${weekly.percent}% (${weekly.present + weekly.late + weekly.excused}/${weekly.total})`,
      `Kelgan: ${weekly.present}, kechikkan: ${weekly.late}, sababli: ${weekly.excused}, sababsiz: ${weekly.absent}`,
    );
  } else {
    lines.push("Haftalik davomat: bu haftada yozuvlar yo'q");
  }

  lines.push(
    "",
    `Umumiy davomat: ${percentText(detail.averageAttendance)}`,
    `O'rtacha GPA: ${detail.averageGpa !== null ? detail.averageGpa.toFixed(2) : "—"}`,
    `Imtihonga ruxsat yo'q: ${detail.lowAttendanceCount} ta talaba`,
    "",
  );

  if (problematic.length === 0) {
    lines.push("Muammoli talabalar yo'q.");
  } else {
    lines.push(`Muammoli talabalar (${problematic.length}):`);
    for (const student of problematic) {
      lines.push(
        `- ${student.name}: davomat ${student.attendance.percent}%, GPA ${student.gpa !== null ? student.gpa.toFixed(2) : "—"}`,
      );
    }
  }

  return lines.join("\n");
}

export async function buildCuratorReport(
  groupId: string,
  week?: string | null,
): Promise<CuratorReport | null> {
  const detail = await buildGroupDetail(groupId);
  if (!detail) return null;

  const start = parseWeekStart(week);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  const ids = detail.students.map((student) => student.id);

  const records =
    ids.length > 0
      ? await prisma.attendance.findMany({
          where: { studentId: { in: ids }, date: { gte: start, lt: end } },
          select: { status: true },
        })
      : [];

  const weekly = attendanceCounts(records.map((record) => record.status));
  const problematic = detail.students.filter((student) => student.problematic);
  const weekEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

  return {
    group: { id: detail.id, name: detail.name },
    week: { start: toIsoDate(start), end: toIsoDate(weekEnd) },
    weekly,
    averageAttendance: detail.averageAttendance,
    averageGpa: detail.averageGpa,
    problematic,
    text: composeReportText(detail, { start, end: weekEnd }, weekly, problematic),
  };
}
