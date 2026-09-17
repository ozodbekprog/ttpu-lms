import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse } from "@/components/courses/course-access";

const updateSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  position: z.number().int().min(0).optional(),
});

async function findSection(id: string) {
  return prisma.section.findUnique({
    where: { id },
    include: { course: true },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const section = await findSection(id);
  if (!section) {
    return Response.json({ ok: false, error: "Bo'lim topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, section.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Bo'lim ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const updated = await prisma.section.update({
    where: { id: section.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
    },
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
  const section = await findSection(id);
  if (!section) {
    return Response.json({ ok: false, error: "Bo'lim topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, section.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.section.delete({ where: { id: section.id } });

  return Response.json({ ok: true, data: { id: section.id } });
}
