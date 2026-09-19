import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/components/orders/shared";
import { logAudit } from "@/server/audit";

const patchSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  adminComment: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Ariza topilmadi" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminComment:
        parsed.data.adminComment === undefined
          ? undefined
          : parsed.data.adminComment || null,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "order.update",
    entity: "Order",
    entityId: order.id,
    meta: { from: existing.status, to: order.status },
  });

  return Response.json({ ok: true, data: order });
}
