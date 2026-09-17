import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const bulkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      }),
    )
    .min(1, "Kamida bitta yozuv kerak"),
});

const removeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD ko'rinishida bo'lishi kerak"),
  studentId: z.string().min(1),
});

export async function GET(
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

  if (user.role === "STUDENT") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
    });
    if (!enrolled) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const entries = await prisma.attendance.findMany({
      where: { courseId: course.id, studentId: user.id },
      orderBy: { date: "desc" },
    });
    return Response.json({ ok: true, data: entries });
  }

  if (!canManageCourse(user, course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const studentId = new URL(request.url).searchParams.get("studentId");
  const date = new URL(request.url).searchParams.get("date");

  const entries = await prisma.attendance.findMany({
    where: {
      courseId: course.id,
      ...(studentId ? { studentId } : {}),
      ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? { date: new Date(`${date}T00:00:00.000Z`) }
        : {}),
    },
    include: { student: { select: { id: true, name: true } } },
    orderBy: [{ date: "desc" }],
    take: 1000,
  });

  return Response.json({ ok: true, data: entries });
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
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
  }

  const uniqueEntries = [
    ...new Map(parsed.data.entries.map((entry) => [entry.studentId, entry])).values(),
  ];
  const studentIds = uniqueEntries.map((entry) => entry.studentId);

  const enrolled = await prisma.enrollment.findMany({
    where: { courseId: course.id, userId: { in: studentIds } },
    select: { userId: true },
  });
  if (enrolled.length !== studentIds.length) {
    return Response.json(
      { ok: false, error: "Ba'zi talabalar bu kursga yozilmagan" },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    uniqueEntries.map((entry) =>
      prisma.attendance.upsert({
        where: {
          courseId_studentId_date: {
            courseId: course.id,
            studentId: entry.studentId,
            date,
          },
        },
        update: { status: entry.status },
        create: {
          courseId: course.id,
          studentId: entry.studentId,
          date,
          status: entry.status,
        },
      }),
    ),
  );

  return Response.json({
    ok: true,
    data: { date: parsed.data.date, count: uniqueEntries.length },
  });
}

export async function DELETE(
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
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
  }

  const removed = await prisma.attendance.deleteMany({
    where: { courseId: course.id, studentId: parsed.data.studentId, date },
  });
  if (removed.count === 0) {
    return Response.json({ ok: false, error: "Yozuv topilmadi" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    data: { date: parsed.data.date, studentId: parsed.data.studentId },
  });
}
