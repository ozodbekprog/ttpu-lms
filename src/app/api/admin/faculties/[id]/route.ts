import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  code: z.string().trim().max(20).nullable().optional(),
  groupIds: z.array(z.string().trim().min(1)).max(500).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const faculty = await prisma.faculty.findUnique({ where: { id } });
  if (!faculty) return Response.json({ ok: false, error: "Fakultet topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Fakultet ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  if (parsed.data.name && parsed.data.name !== faculty.name) {
    const existing = await prisma.faculty.findUnique({ where: { name: parsed.data.name } });
    if (existing) return Response.json({ ok: false, error: "Bu nomdagi fakultet mavjud" }, { status: 409 });
  }

  if (parsed.data.groupIds !== undefined) {
    const groupIds = Array.from(new Set(parsed.data.groupIds));
    const found = await prisma.group.count({ where: { id: { in: groupIds } } });
    if (found !== groupIds.length) {
      return Response.json({ ok: false, error: "Ba'zi guruhlar topilmadi" }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.group.updateMany({
        where: { facultyId: id, id: { notIn: groupIds } },
        data: { facultyId: null },
      }),
      prisma.group.updateMany({
        where: { id: { in: groupIds } },
        data: { facultyId: id },
      }),
    ]);
  }

  const data: { name?: string; code?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.code !== undefined) data.code = parsed.data.code ? parsed.data.code : null;
  if (Object.keys(data).length > 0) {
    await prisma.faculty.update({ where: { id }, data });
  }

  const updated = await prisma.faculty.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { groups: true } } },
  });
  const { _count, ...rest } = updated;

  return Response.json({ ok: true, data: { ...rest, groupsCount: _count.groups } });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const faculty = await prisma.faculty.findUnique({ where: { id } });
  if (!faculty) return Response.json({ ok: false, error: "Fakultet topilmadi" }, { status: 404 });

  await prisma.faculty.delete({ where: { id } });
  return Response.json({ ok: true, data: { id } });
}
