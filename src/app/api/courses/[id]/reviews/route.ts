import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).nullable().optional(),
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

  const { id } = await params;
  const course = await findCourse(id);
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }

  const canManage = canManageCourse(user, course);
  if (!canManage) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
      select: { id: true },
    });
    if (!enrollment) {
      return Response.json(
        { ok: false, error: "Sharhlarni ko'rish uchun ruxsat yo'q" },
        { status: 403 },
      );
    }
  }

  const reviews = await prisma.courseReview.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const average =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10,
        ) / 10
      : null;

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));

  return Response.json({
    ok: true,
    data: {
      average,
      count: reviews.length,
      distribution,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.user,
        mine: review.userId === user.id,
      })),
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "STUDENT") {
    return Response.json(
      { ok: false, error: "Faqat talabalar sharh qoldirishi mumkin" },
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
      { ok: false, error: "Faqat kursga yozilgan talabalar sharh qoldirishi mumkin" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Sharh ma'lumotlari noto'g'ri (rating 1-5, izoh 500 belgidan oshmasin)" },
      { status: 400 },
    );
  }

  const comment = parsed.data.comment ? parsed.data.comment : null;

  const existing = await prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId: course.id, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    const review = await prisma.courseReview.update({
      where: { id: existing.id },
      data: { rating: parsed.data.rating, comment },
    });
    return Response.json({ ok: true, data: review });
  }

  const review = await prisma.courseReview.create({
    data: {
      courseId: course.id,
      userId: user.id,
      rating: parsed.data.rating,
      comment,
    },
  });

  return Response.json({ ok: true, data: review }, { status: 201 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await findCourse(id);
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }

  const review = await prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId: course.id, userId: user.id } },
    select: { id: true },
  });
  if (!review) {
    return Response.json({ ok: false, error: "Sharh topilmadi" }, { status: 404 });
  }

  await prisma.courseReview.delete({ where: { id: review.id } });

  return Response.json({ ok: true, data: { id: review.id } });
}
