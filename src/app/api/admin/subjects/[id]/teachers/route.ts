import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  teacherIds: z.array(z.string().trim().min(1)).max(100),
});

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return Response.json({ ok: false, error: "Fan topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "O'qituvchilar ro'yxati noto'g'ri" }, { status: 400 });
  }

  const teacherIds = [...new Set(parsed.data.teacherIds)];
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds }, role: "TEACHER" },
    select: { id: true },
  });
  if (teachers.length !== teacherIds.length) {
    return Response.json({ ok: false, error: "Faqat TEACHER rolidagi foydalanuvchilar biriktiriladi" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.teacherSubject.deleteMany({ where: { subjectId: id } }),
    prisma.teacherSubject.createMany({
      data: teacherIds.map((teacherId) => ({ teacherId, subjectId: id })),
      skipDuplicates: true,
    }),
  ]);

  const updated = await prisma.teacherSubject.findMany({
    where: { subjectId: id },
    orderBy: { teacher: { name: "asc" } },
    select: { teacher: { select: { id: true, name: true } } },
  });

  return Response.json({
    ok: true,
    data: { subjectId: id, teachers: updated.map((item) => item.teacher) },
  });
}
