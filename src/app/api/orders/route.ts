import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_TYPES } from "@/components/orders/shared";

const createSchema = z.object({
  type: z.enum(ORDER_TYPES),
  subject: z.string().trim().min(2).max(200),
  note: z.string().trim().max(2000).nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ ok: true, data: orders });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ariza ma'lumotlari to'liq emas" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      subject: parsed.data.subject,
      note: parsed.data.note ?? null,
    },
  });

  return Response.json({ ok: true, data: order }, { status: 201 });
}
