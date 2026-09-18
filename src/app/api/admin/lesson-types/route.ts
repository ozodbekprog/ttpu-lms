import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const colorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  color: colorSchema.optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const lessonTypes = await prisma.lessonType.findMany({ orderBy: { name: "asc" } });
  return Response.json({ ok: true, data: lessonTypes });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dars turi ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const { name } = parsed.data;
  const existing = await prisma.lessonType.findUnique({ where: { name } });
  if (existing) return Response.json({ ok: false, error: "Bu nomdagi dars turi mavjud" }, { status: 409 });

  const lessonType = await prisma.lessonType.create({
    data: { name, color: parsed.data.color ?? "#5373b8" },
  });

  return Response.json({ ok: true, data: lessonType }, { status: 201 });
}
