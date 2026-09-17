import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse, canViewCourse } from "@/components/courses/course-access";

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  position: z.number().int().min(0).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const course = await prisma.course.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      enrollments: { where: { userId: user.id }, select: { id: true } },
      sections: {
        orderBy: { position: "asc" },
        include: { materials: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }

  if (!canViewCourse(user, course, course.enrollments.length > 0)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ ok: true, data: course.sections });
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

  const course = await prisma.course.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });

  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Bo'lim nomi kiritilishi shart" }, { status: 400 });
  }

  let position = parsed.data.position;
  if (position === undefined) {
    const max = await prisma.section.aggregate({
      where: { courseId: course.id },
      _max: { position: true },
    });
    position = (max._max.position ?? 0) + 1;
  }

  const section = await prisma.section.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      position,
    },
    include: { materials: true },
  });

  return Response.json({ ok: true, data: section }, { status: 201 });
}
