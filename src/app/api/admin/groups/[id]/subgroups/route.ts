import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1).max(20),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { error: Response.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const group = await prisma.group.findUnique({
    where: { id },
    select: { id: true, name: true, curatorId: true },
  });
  if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });

  const [subGroups, students, teachers] = await Promise.all([
    prisma.subGroup.findMany({
      where: { groupId: id },
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { groupId: id, role: "STUDENT" },
      select: { id: true, name: true, email: true, subGroupId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return Response.json({
    ok: true,
    data: {
      group,
      subGroups: subGroups.map((item) => ({ id: item.id, name: item.name, userCount: item._count.users })),
      students,
      teachers,
    },
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const group = await prisma.group.findUnique({ where: { id }, select: { id: true } });
  if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Kichik guruh nomini kiriting" }, { status: 400 });
  }

  const name = parsed.data.name;
  const existing = await prisma.subGroup.findUnique({ where: { groupId_name: { groupId: id, name } } });
  if (existing) {
    return Response.json({ ok: false, error: "Bu nomdagi kichik guruh mavjud" }, { status: 409 });
  }

  const created = await prisma.subGroup.create({ data: { groupId: id, name } });
  return Response.json(
    { ok: true, data: { id: created.id, name: created.name, userCount: 0 } },
    { status: 201 },
  );
}
