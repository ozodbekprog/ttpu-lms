import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(20).nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const faculties = await prisma.faculty.findMany({
    include: { _count: { select: { groups: true } } },
    orderBy: { name: "asc" },
  });

  return Response.json({
    ok: true,
    data: faculties.map(({ _count, ...faculty }) => ({ ...faculty, groupsCount: _count.groups })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Fakultet ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const { name } = parsed.data;
  const existing = await prisma.faculty.findUnique({ where: { name } });
  if (existing) return Response.json({ ok: false, error: "Bu nomdagi fakultet mavjud" }, { status: 409 });

  const faculty = await prisma.faculty.create({
    data: { name, code: parsed.data.code ? parsed.data.code : null },
    include: { _count: { select: { groups: true } } },
  });

  const { _count, ...rest } = faculty;
  return Response.json({ ok: true, data: { ...rest, groupsCount: _count.groups } }, { status: 201 });
}
