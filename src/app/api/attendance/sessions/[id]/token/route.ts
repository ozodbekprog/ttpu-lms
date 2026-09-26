import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";
import { QR_TOKEN_TTL_SECONDS } from "@/modules/attendance-security/config";
import { checkInUrl, signQrToken } from "@/modules/attendance-security/qr-token";
import { requestOrigin } from "@/lib/request-origin";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).optional(),
});

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
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: { course: { select: { teacherId: true } } },
  });
  if (!session) {
    return Response.json({ ok: false, error: "Sessiya topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, session.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    return Response.json({ ok: false, error: "Sessiya faol emas" }, { status: 400 });
  }

  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(rawBody ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const { lat, lng, accuracy } = parsed.data;
  const location =
    lat !== undefined && lng !== undefined
      ? { lat, lng, ...(accuracy !== undefined ? { accuracy } : {}) }
      : undefined;

  const token = await signQrToken({ sessionId: session.id, courseId: session.courseId, location });
  const url = checkInUrl(requestOrigin(request), token);

  return Response.json({
    ok: true,
    data: {
      token,
      url,
      expiresIn: QR_TOKEN_TTL_SECONDS,
      sessionId: session.id,
      code: session.code,
    },
  });
}
