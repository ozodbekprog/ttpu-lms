import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse, canViewCourse, materialRuleError } from "@/components/courses/course-access";
import { notifyCourseStudents } from "@/server/notify";

const MATERIAL_TYPES = ["TEXT", "FILE", "VIDEO", "LINK"] as const;

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.enum(MATERIAL_TYPES),
  content: z.string().trim().max(20000).nullable().optional(),
  fileUrl: z.string().trim().max(2000).nullable().optional(),
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

  const section = await prisma.section.findUnique({
    where: { id },
    include: {
      materials: { orderBy: { position: "asc" } },
      course: {
        include: { enrollments: { where: { userId: user.id }, select: { id: true } } },
      },
    },
  });

  if (!section) {
    return Response.json({ ok: false, error: "Bo'lim topilmadi" }, { status: 404 });
  }

  if (!canViewCourse(user, section.course, section.course.enrollments.length > 0)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ ok: true, data: section.materials });
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

  const section = await prisma.section.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!section) {
    return Response.json({ ok: false, error: "Bo'lim topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, section.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Material ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const ruleError = materialRuleError(parsed.data.type, parsed.data.content, parsed.data.fileUrl);
  if (ruleError) {
    return Response.json({ ok: false, error: ruleError }, { status: 400 });
  }

  let position = parsed.data.position;
  if (position === undefined) {
    const max = await prisma.material.aggregate({
      where: { sectionId: section.id },
      _max: { position: true },
    });
    position = (max._max.position ?? 0) + 1;
  }

  const material = await prisma.material.create({
    data: {
      sectionId: section.id,
      title: parsed.data.title,
      type: parsed.data.type,
      content: parsed.data.content || null,
      fileUrl: parsed.data.fileUrl || null,
      position,
    },
  });

  try {
    await notifyCourseStudents(section.courseId, {
      title: `Yangi material: ${material.title}`,
      link: `/courses/${section.course.slug}`,
    });
  } catch {}

  return Response.json({ ok: true, data: material }, { status: 201 });
}
