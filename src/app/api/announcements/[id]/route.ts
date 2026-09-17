import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const updateSchema = z
  .object({
    title: z.string().trim().min(1, "Sarlavha kiriting").max(200).optional(),
    body: z.string().trim().min(1, "E'lon matnini kiriting").max(10000).optional(),
  })
  .refine((value) => value.title !== undefined || value.body !== undefined, {
    message: "O'zgartirish uchun maydon kiriting",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { course: { select: { id: true, slug: true, teacherId: true } } },
  });
  if (!announcement) {
    return Response.json({ ok: false, error: "E'lon topilmadi" }, { status: 404 });
  }
  if (announcement.authorId !== user.id && !canManageCourse(user, announcement.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id: announcement.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return Response.json({ ok: true, data: updated });
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
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { course: { select: { id: true, slug: true, teacherId: true } } },
  });
  if (!announcement) {
    return Response.json({ ok: false, error: "E'lon topilmadi" }, { status: 404 });
  }
  if (announcement.authorId !== user.id && !canManageCourse(user, announcement.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id: announcement.id } });

  return Response.json({ ok: true, data: { id: announcement.id } });
}
