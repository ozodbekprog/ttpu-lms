import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolveCourseAccess } from "@/components/forum/thread-access";

const createSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting").max(200),
  body: z.string().trim().min(1, "Mavzu matnini kiriting").max(10000),
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

  const topics = await prisma.forumTopic.findMany({
    where: { courseId: access.course.id },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { replies: true } },
    },
  });

  return Response.json({ ok: true, data: topics });
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
  if (!access.canView) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const topic = await prisma.forumTopic.create({
    data: {
      courseId: access.course.id,
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return Response.json({ ok: true, data: topic }, { status: 201 });
}
