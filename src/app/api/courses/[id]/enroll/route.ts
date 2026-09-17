import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function findCourse(id: string) {
  return prisma.course.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, isPublished: true },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "STUDENT") {
    return Response.json(
      { ok: false, error: "Faqat talabalar kursga yozilishi mumkin" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const course = await findCourse(id);
  if (!course || !course.isPublished) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: course.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { ok: false, error: "Siz allaqachon bu kursga yozilgansiz" },
      { status: 409 },
    );
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: { courseId: course.id, userId: user.id },
    });
    return Response.json({ ok: true, data: enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        { ok: false, error: "Siz allaqachon bu kursga yozilgansiz" },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "STUDENT") {
    return Response.json(
      { ok: false, error: "Faqat talabalar kursdan chiqishi mumkin" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const course = await findCourse(id);
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: course.id, userId: user.id } },
    select: { id: true },
  });
  if (!enrollment) {
    return Response.json(
      { ok: false, error: "Siz bu kursga yozilmagansiz" },
      { status: 404 },
    );
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });

  return Response.json({ ok: true, data: { id: enrollment.id } });
}
