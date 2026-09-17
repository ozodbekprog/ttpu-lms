import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";
import { notifyCourseStudents } from "@/server/notify";

const createSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting").max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  dueAt: z.string().trim().nullable().optional(),
  maxScore: z.coerce.number().int().min(1).max(1000).optional(),
});

function parseDueAt(value: string | null | undefined) {
  if (!value) return { ok: true as const, date: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false as const, date: null };
  return { ok: true as const, date };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }

  if (user.role === "STUDENT") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
    });
    if (!enrolled) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "asc" },
      include: { submissions: { where: { studentId: user.id } } },
    });
    return Response.json({ ok: true, data: assignments });
  }

  if (!canManageCourse(user, course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { submissions: true } } },
  });
  return Response.json({ ok: true, data: assignments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const due = parseDueAt(parsed.data.dueAt);
  if (!due.ok) {
    return Response.json({ ok: false, error: "Muddat sanasi noto'g'ri" }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueAt: due.date,
      maxScore: parsed.data.maxScore ?? 100,
    },
  });

  try {
    await notifyCourseStudents(course.id, {
      title: `Yangi topshiriq: ${assignment.title}`,
      body: assignment.dueAt
        ? `Muddat: ${assignment.dueAt.toLocaleDateString("uz-UZ")}`
        : undefined,
      link: `/courses/${course.slug}/assignments/${assignment.id}`,
    });
  } catch {}

  return Response.json({ ok: true, data: assignment }, { status: 201 });
}
