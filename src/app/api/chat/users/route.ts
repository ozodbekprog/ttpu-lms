import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ ok: true, data: { users: [] } });
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: user.id },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, avatarUrl: true, role: true },
    orderBy: { name: "asc" },
    take: 10,
  });

  return Response.json({ ok: true, data: { users } });
}
