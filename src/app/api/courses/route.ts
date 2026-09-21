import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyCsrfFromRequest } from "@/lib/csrf";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  coverColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#2563eb"),
  isPublished: z.boolean().default(false),
});

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "kurs";
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const where =
    user.role === "ADMIN"
      ? {}
      : user.role === "TEACHER"
        ? { teacherId: user.id }
        : { enrollments: { some: { userId: user.id } } };

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      teacher: { select: { id: true, name: true } },
      sections: { select: { _count: { select: { materials: true } } } },
      _count: { select: { enrollments: true } },
    },
  });

  const data = courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    coverColor: course.coverColor,
    isPublished: course.isPublished,
    createdAt: course.createdAt,
    teacher: course.teacher,
    materialsCount: course.sections.reduce((sum, s) => sum + s._count.materials, 0),
    studentsCount: course._count.enrollments,
  }));

  return Response.json({ ok: true, data });
}

export async function POST(request: Request) {
  const clientInfo = getClientInfo(request);

  const csrfValid = await verifyCsrfFromRequest(request);
  if (!csrfValid) {
    await createAuditLog({
      action: "USER_CREATE",
      meta: { reason: "csrf_invalid", endpoint: "courses" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Kurs ma'lumotlari to'liq emas" }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      slug: await uniqueSlug(parsed.data.title),
      description: parsed.data.description || null,
      coverColor: parsed.data.coverColor,
      isPublished: parsed.data.isPublished,
      teacherId: user.id,
    },
  });

  await createAuditLog({
    action: "USER_CREATE",
    entity: "Course",
    entityId: course.id,
    meta: { title: course.title, createdBy: user.id },
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });

  return Response.json({ ok: true, data: course }, { status: 201 });
}
