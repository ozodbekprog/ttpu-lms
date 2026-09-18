import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOrderStatus } from "@/components/orders/shared";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const status = new URL(request.url).searchParams.get("status");
  const where = status && isOrderStatus(status) ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          group: { select: { name: true } },
        },
      },
    },
  });

  return Response.json({ ok: true, data: orders });
}
