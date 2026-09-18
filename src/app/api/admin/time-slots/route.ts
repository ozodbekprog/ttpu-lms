import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const createSchema = z.object({
  slot: z.number().int().min(1).max(20),
  startTime: timeSchema,
  endTime: timeSchema,
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const timeSlots = await prisma.timeSlot.findMany({ orderBy: { slot: "asc" } });
  return Response.json({ ok: true, data: timeSlots });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dars vaqti ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const existing = await prisma.timeSlot.findUnique({ where: { slot: parsed.data.slot } });
  if (existing) {
    return Response.json({ ok: false, error: "Bu raqamli dars vaqti mavjud" }, { status: 409 });
  }

  const timeSlot = await prisma.timeSlot.create({
    data: {
      slot: parsed.data.slot,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  });

  return Response.json({ ok: true, data: timeSlot }, { status: 201 });
}
