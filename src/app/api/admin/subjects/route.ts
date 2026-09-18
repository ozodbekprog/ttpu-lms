import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const colorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(20).nullable().optional(),
  color: colorSchema.optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  return Response.json({ ok: true, data: subjects });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Fan ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const { name } = parsed.data;
  const existing = await prisma.subject.findUnique({ where: { name } });
  if (existing) return Response.json({ ok: false, error: "Bu nomdagi fan mavjud" }, { status: 409 });

  const subject = await prisma.subject.create({
    data: {
      name,
      code: parsed.data.code ? parsed.data.code : null,
      color: parsed.data.color ?? "#3f5a9d",
    },
  });

  return Response.json({ ok: true, data: subject }, { status: 201 });
}
