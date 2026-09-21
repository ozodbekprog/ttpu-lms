import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCertificate } from "@/components/certificates/certificate-access";
import { logAudit } from "@/server/audit";
import { verifyCsrfFromRequest } from "@/lib/csrf";

const createSchema = z.object({
  courseId: z.string().trim().min(1),
  studentId: z.string().trim().min(1),
  grade: z.number().int().min(0).max(100).nullable().optional(),
});

const certificateInclude = {
  course: { select: { id: true, title: true, slug: true, coverColor: true, teacherId: true } },
  student: { select: { id: true, name: true, group: { select: { name: true } } } },
  issuedBy: { select: { id: true, name: true } },
} as const;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const courseId = new URL(request.url).searchParams.get("courseId") ?? undefined;

  if (user.role === "STUDENT") {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: user.id, ...(courseId ? { courseId } : {}) },
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true, coverColor: true } },
        issuedBy: { select: { id: true, name: true } },
      },
    });
    return Response.json({ ok: true, data: certificates });
  }

  const certificates = await prisma.certificate.findMany({
    where: courseId ? { courseId } : {},
    orderBy: { issuedAt: "desc" },
    include: certificateInclude,
  });

  return Response.json({ ok: true, data: certificates });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const csrfValid = await verifyCsrfFromRequest(request);
  if (!csrfValid) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Sertifikat ma'lumotlari to'liq emas" }, { status: 400 });
  }

  const { courseId, studentId } = parsed.data;
  const grade = parsed.data.grade ?? null;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, teacherId: true },
  });
  if (!course) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!canManageCertificate(user, { course })) {
    return Response.json(
      { ok: false, error: "Faqat o'z kursingizga sertifikat bera olasiz" },
      { status: 403 },
    );
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, isActive: true },
  });
  if (!student || student.role !== "STUDENT" || !student.isActive) {
    return Response.json({ ok: false, error: "Talaba topilmadi" }, { status: 404 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: studentId } },
    select: { id: true },
  });
  if (!enrollment) {
    return Response.json({ ok: false, error: "Talaba kursga yozilmagan" }, { status: 400 });
  }

  const existing = await prisma.certificate.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { ok: false, error: "Bu talabaga ushbu kurs uchun sertifikat allaqachon berilgan" },
      { status: 409 },
    );
  }

  try {
    const certificate = await prisma.certificate.create({
      data: { courseId, studentId, grade, issuedById: user.id },
      include: certificateInclude,
    });
    await logAudit({
      actorId: user.id,
      action: "certificate.issue",
      entity: "Certificate",
      entityId: certificate.id,
      meta: { courseId, studentId, grade },
    });
    return Response.json({ ok: true, data: certificate }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        { ok: false, error: "Bu talabaga ushbu kurs uchun sertifikat allaqachon berilgan" },
        { status: 409 },
      );
    }
    throw error;
  }
}
