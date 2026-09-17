import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse, isAllowedFileUrl } from "@/components/courses/course-access";

const submitSchema = z
  .object({
    text: z.string().trim().max(10000).nullable().optional(),
    fileUrl: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional()
      .refine((value) => !value || isAllowedFileUrl(value), {
        message: "Fayl havolasi http://, https:// yoki /uploads/ bilan boshlanishi kerak",
      }),
  })
  .refine((value) => Boolean(value.text?.length || value.fileUrl?.length), {
    message: "Matn yoki fayl havolasini kiriting",
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
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!assignment) {
    return Response.json({ ok: false, error: "Topshiriq topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, assignment.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: id },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "asc" },
  });

  return Response.json({ ok: true, data: submissions });
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
    return Response.json({ ok: false, error: "Faqat talaba topshira oladi" }, { status: 403 });
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!assignment) {
    return Response.json({ ok: false, error: "Topshiriq topilmadi" }, { status: 404 });
  }

  const enrolled = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: assignment.courseId, userId: user.id } },
  });
  if (!enrolled) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
  });
  if (existing?.status === "GRADED") {
    return Response.json(
      { ok: false, error: "Baholangan topshiriqni qayta topshirib bo'lmaydi" },
      { status: 409 },
    );
  }

  const status =
    assignment.dueAt && new Date() > assignment.dueAt ? ("LATE" as const) : ("SUBMITTED" as const);

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
    update: {
      text: parsed.data.text || null,
      fileUrl: parsed.data.fileUrl || null,
      submittedAt: new Date(),
      status,
      score: null,
      feedback: null,
      gradedAt: null,
    },
    create: {
      assignmentId: id,
      studentId: user.id,
      text: parsed.data.text || null,
      fileUrl: parsed.data.fileUrl || null,
      status,
    },
  });

  return Response.json({ ok: true, data: submission }, { status: 201 });
}
