import "server-only";
import { prisma } from "@/lib/prisma";

export type WorkloadCourse = {
  id: string;
  title: string;
  slug: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  assignmentCount: number;
  pendingSubmissions: number;
  quizCount: number;
  pendingTextAnswers: number;
  weeklyHours: number;
};

export type WorkloadTeacher = {
  id: string;
  name: string;
  email: string;
  courseCount: number;
  studentCount: number;
  weeklyHours: number;
  pendingReviews: number;
  courses: WorkloadCourse[];
};

export type WorkloadSummary = {
  courseCount: number;
  studentCount: number;
  pendingReviews: number;
  weeklyHours: number;
};

export type WorkloadScope = {
  teacherId: string | null;
  teacherName: string | null;
};

export type WorkloadData = {
  scope: WorkloadScope;
  summary: WorkloadSummary;
  courses: WorkloadCourse[];
  teachers: WorkloadTeacher[];
};

const HOURS_PER_ENTRY = 1.5;

export function normalizeTeacherName(name: string) {
  return name.replace(/\./g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function matchCourseId(
  subject: string,
  courses: Array<{ id: string; title: string }>,
): string | null {
  const subjectTokens = new Set(tokenize(subject));
  if (subjectTokens.size === 0) return null;
  let best: { id: string; score: number } | null = null;
  for (const course of courses) {
    const score = tokenize(course.title).filter((token) => subjectTokens.has(token)).length;
    if (score > 0 && (best === null || score > best.score)) {
      best = { id: course.id, score };
    }
  }
  return best?.id ?? null;
}

function parseAnswers(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function roundHours(value: number) {
  return Math.round(value * 10) / 10;
}

export function formatHours(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export async function buildWorkloadData(options: {
  teacherId: string | null;
  includeAllTeachers: boolean;
}): Promise<WorkloadData> {
  const [teacherUsers, courseRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        teacherId: true,
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true, assignments: true, quizzes: true } },
      },
    }),
  ]);

  const courseIds = courseRows.map((course) => course.id);
  const assignmentRows = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, courseId: true },
  });
  const assignmentCourse = new Map(assignmentRows.map((row) => [row.id, row.courseId]));

  const [pendingGroups, quizRows, scheduleRows] = await Promise.all([
    prisma.submission.groupBy({
      by: ["assignmentId"],
      where: {
        assignmentId: { in: assignmentRows.map((row) => row.id) },
        status: { not: "GRADED" },
      },
      _count: { _all: true },
    }),
    prisma.quiz.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        id: true,
        courseId: true,
        questions: { select: { id: true, type: true } },
        attempts: { select: { answers: true, finishedAt: true } },
      },
    }),
    prisma.scheduleEntry.findMany({
      select: { id: true, teacher: true, subject: true },
    }),
  ]);

  const pendingByCourse = new Map<string, number>();
  for (const group of pendingGroups) {
    const courseId = assignmentCourse.get(group.assignmentId);
    if (!courseId) continue;
    pendingByCourse.set(courseId, (pendingByCourse.get(courseId) ?? 0) + group._count._all);
  }

  const textPendingByCourse = new Map<string, number>();
  for (const quiz of quizRows) {
    const textQuestionIds = new Set(
      quiz.questions.filter((question) => question.type === "TEXT").map((question) => question.id),
    );
    if (textQuestionIds.size === 0) continue;
    let count = 0;
    for (const attempt of quiz.attempts) {
      if (!attempt.finishedAt) continue;
      const answers = parseAnswers(attempt.answers);
      for (const questionId of textQuestionIds) {
        const answer = answers[questionId];
        if (typeof answer === "string" && answer.trim().length > 0) count += 1;
      }
    }
    if (count > 0) {
      textPendingByCourse.set(quiz.courseId, (textPendingByCourse.get(quiz.courseId) ?? 0) + count);
    }
  }

  const coursesByTeacher = new Map<string, Array<{ id: string; title: string }>>();
  for (const course of courseRows) {
    const list = coursesByTeacher.get(course.teacherId) ?? [];
    list.push({ id: course.id, title: course.title });
    coursesByTeacher.set(course.teacherId, list);
  }

  const teacherByKey = new Map(
    teacherUsers.map((teacher) => [normalizeTeacherName(teacher.name), teacher]),
  );
  const entryCountByCourse = new Map<string, number>();
  const entryCountByTeacher = new Map<string, number>();
  for (const entry of scheduleRows) {
    if (!entry.teacher) continue;
    const teacher = teacherByKey.get(normalizeTeacherName(entry.teacher));
    if (!teacher) continue;
    entryCountByTeacher.set(teacher.id, (entryCountByTeacher.get(teacher.id) ?? 0) + 1);
    const matched = matchCourseId(entry.subject, coursesByTeacher.get(teacher.id) ?? []);
    if (matched) entryCountByCourse.set(matched, (entryCountByCourse.get(matched) ?? 0) + 1);
  }

  const rows: WorkloadCourse[] = courseRows.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    teacherId: course.teacherId,
    teacherName: course.teacher.name,
    studentCount: course._count.enrollments,
    assignmentCount: course._count.assignments,
    pendingSubmissions: pendingByCourse.get(course.id) ?? 0,
    quizCount: course._count.quizzes,
    pendingTextAnswers: textPendingByCourse.get(course.id) ?? 0,
    weeklyHours: roundHours((entryCountByCourse.get(course.id) ?? 0) * HOURS_PER_ENTRY),
  }));

  const teacherRows: WorkloadTeacher[] = teacherUsers.map((teacher) => {
    const teacherCourses = rows.filter((row) => row.teacherId === teacher.id);
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      courseCount: teacherCourses.length,
      studentCount: teacherCourses.reduce((sum, row) => sum + row.studentCount, 0),
      weeklyHours: roundHours((entryCountByTeacher.get(teacher.id) ?? 0) * HOURS_PER_ENTRY),
      pendingReviews: teacherCourses.reduce(
        (sum, row) => sum + row.pendingSubmissions + row.pendingTextAnswers,
        0,
      ),
      courses: teacherCourses,
    };
  });

  const teachers = options.includeAllTeachers
    ? teacherRows
    : teacherRows.filter((row) => row.id === options.teacherId);
  const courses = options.teacherId
    ? rows.filter((row) => row.teacherId === options.teacherId)
    : rows;
  const scopeTeacher = options.teacherId
    ? teacherRows.find((row) => row.id === options.teacherId) ?? null
    : null;

  const summary: WorkloadSummary = {
    courseCount: courses.length,
    studentCount: courses.reduce((sum, row) => sum + row.studentCount, 0),
    pendingReviews: courses.reduce(
      (sum, row) => sum + row.pendingSubmissions + row.pendingTextAnswers,
      0,
    ),
    weeklyHours: roundHours(
      options.teacherId
        ? scopeTeacher?.weeklyHours ?? 0
        : teacherRows.reduce((sum, row) => sum + row.weeklyHours, 0),
    ),
  };

  return {
    scope: {
      teacherId: options.teacherId,
      teacherName: scopeTeacher?.name ?? null,
    },
    summary,
    courses,
    teachers,
  };
}
