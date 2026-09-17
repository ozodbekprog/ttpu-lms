import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const createSchema = z.object({
  userId: z.string().trim().min(1),
});

async function findCourse(id: string) {
  return prisma.course.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, teacherId: true },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const course = await findCourse(id);
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      group: { select: { name: true } },
      enrollments: { where: { courseId: course.id }, select: { id: true } },
    },
  });

  const data = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    group: student.group,
    isEnrolled: student.enrollments.length > 0,
  }));

  return Response.json({ ok: true, data: { students: data } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const course = await findCourse(id);
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Talaba tanlanmagan" }, { status: 400 });
  }

  const student = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!student || student.role !== "STUDENT") {
    return Response.json({ ok: false, error: "Talaba topilmadi" }, { status: 404 });
  }
  if (!student.isActive) {
    return Response.json({ ok: false, error: "Talaba faol emas" }, { status: 400 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: course.id, userId: student.id } },
    select: { id: true },
  });
  if (existing) {
    return Response.json({ ok: false, error: "Talaba allaqachon yozilgan" }, { status: 409 });
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: { courseId: course.id, userId: student.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            group: { select: { name: true } },
          },
        },
      },
    });
    return Response.json({ ok: true, data: enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ ok: false, error: "Talaba allaqachon yozilgan" }, { status: 409 });
    }
    throw error;
  }
}
