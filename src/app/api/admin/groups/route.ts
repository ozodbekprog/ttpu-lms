import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  year: z.number().int().min(2000).max(2100).nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const groups = await prisma.group.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  return Response.json({ ok: true, data: groups });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Guruh nomini to'g'ri kiriting" }, { status: 400 });
  }

  const name = parsed.data.name;
  const existing = await prisma.group.findUnique({ where: { name } });
  if (existing) return Response.json({ ok: false, error: "Bu nomdagi guruh mavjud" }, { status: 409 });

  const group = await prisma.group.create({
    data: { name, year: parsed.data.year ?? null },
    include: { _count: { select: { users: true } } },
  });

  return Response.json({ ok: true, data: group }, { status: 201 });
}
