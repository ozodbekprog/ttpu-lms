import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyCourseStudents } from "@/server/notify";
import { resolveCourseAccess } from "@/components/forum/thread-access";

const createSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting").max(200),
  body: z.string().trim().min(1, "E'lon matnini kiriting").max(10000),
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
  const access = await resolveCourseAccess(id, user);
  if (!access) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!access.canView) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const announcements = await prisma.announcement.findMany({
    where: { courseId: access.course.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });

  return Response.json({ ok: true, data: announcements });
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
  const access = await resolveCourseAccess(id, user);
  if (!access) {
    return Response.json({ ok: false, error: "Kurs topilmadi" }, { status: 404 });
  }
  if (!access.management) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      courseId: access.course.id,
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  try {
    await notifyCourseStudents(access.course.id, {
      title: `Yangi e'lon: ${announcement.title}`,
      body: announcement.body.slice(0, 200),
      link: `/courses/${access.course.slug}/announcements`,
    });
  } catch {}

  return Response.json({ ok: true, data: announcement }, { status: 201 });
}
