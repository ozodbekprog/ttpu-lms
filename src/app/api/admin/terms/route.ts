import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const terms = await prisma.term.findMany({
    include: { _count: { select: { sessions: true } } },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
  });

  return Response.json({
    ok: true,
    data: terms.map(({ _count, ...term }) => ({ ...term, sessionsCount: _count.sessions })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Semestr ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const { name, startDate, endDate, isActive } = parsed.data;
  if (endDate.getTime() <= startDate.getTime()) {
    return Response.json({ ok: false, error: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak" }, { status: 400 });
  }

  const existing = await prisma.term.findUnique({ where: { name } });
  if (existing) return Response.json({ ok: false, error: "Bu nomdagi semestr mavjud" }, { status: 409 });

  const include = { _count: { select: { sessions: true } } };
  const term = isActive
    ? await prisma.$transaction(async (tx) => {
        await tx.term.updateMany({ where: { isActive: true }, data: { isActive: false } });
        return tx.term.create({ data: { name, startDate, endDate, isActive: true }, include });
      })
    : await prisma.term.create({ data: { name, startDate, endDate, isActive: false }, include });

  const { _count, ...rest } = term;
  return Response.json({ ok: true, data: { ...rest, sessionsCount: _count.sessions } }, { status: 201 });
}
