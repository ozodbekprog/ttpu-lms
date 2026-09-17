import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const [users, teachers, students, courses, groups, submissions, quizzes] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.group.count(),
    prisma.submission.count(),
    prisma.quiz.count(),
  ]);

  return Response.json({
    ok: true,
    data: { users, teachers, students, courses, groups, submissions, quizzes },
  });
}
