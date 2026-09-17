import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const checkInSchema = z.object({
  code: z.string().trim().min(4).max(12),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "STUDENT") {
    return Response.json({ ok: false, error: "Faqat talabalar belgilanishi mumkin" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Kod 6 belgidan iborat bo'lishi kerak" }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();
  const session = await prisma.attendanceSession.findUnique({
    where: { code },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });
  if (!session) {
    return Response.json({ ok: false, error: "Bunday kodli faol sessiya topilmadi" }, { status: 404 });
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    return Response.json({ ok: false, error: "Sessiya muddati tugagan" }, { status: 400 });
  }

  const enrolled = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: session.courseId, userId: user.id } },
  });
  if (!enrolled) {
    return Response.json({ ok: false, error: "Siz bu kursga yozilmagansiz" }, { status: 403 });
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      courseId_studentId_date: {
        courseId: session.courseId,
        studentId: user.id,
        date: session.date,
      },
    },
  });
  if (existing) {
    return Response.json(
      { ok: false, error: "Bugun bu kurs uchun davomat allaqachon belgilangan" },
      { status: 409 },
    );
  }

  await prisma.attendance.upsert({
    where: {
      courseId_studentId_date: {
        courseId: session.courseId,
        studentId: user.id,
        date: session.date,
      },
    },
    update: { status: "PRESENT" },
    create: {
      courseId: session.courseId,
      studentId: user.id,
      date: session.date,
      status: "PRESENT",
      note: "QR orqali",
    },
  });

  return Response.json({
    ok: true,
    data: {
      course: session.course,
      date: session.date.toISOString().slice(0, 10),
    },
  });
}
