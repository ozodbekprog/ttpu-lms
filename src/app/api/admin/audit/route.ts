import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 100;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const action = params.get("action")?.trim() ?? "";
  const actorId = params.get("actorId")?.trim() ?? "";
  const pageParam = Number(params.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const where: { action?: string; actorId?: string } = {};
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return Response.json({
    ok: true,
    data: {
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    },
  });
}
