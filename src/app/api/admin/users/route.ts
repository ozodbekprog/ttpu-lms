import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userSelect } from "./select";

const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  role: z.enum(ROLES),
  groupId: z.string().trim().min(1).nullable().optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && ROLES.includes(role as Role)) where.role = role as Role;

  const users = await prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ ok: true, data: users });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar to'liq emas yoki xato" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return Response.json({ ok: false, error: "Bu email band" }, { status: 409 });

  if (parsed.data.groupId) {
    const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId } });
    if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: parsed.data.role,
      groupId: parsed.data.groupId ?? null,
    },
    select: userSelect,
  });

  return Response.json({ ok: true, data: created }, { status: 201 });
}
