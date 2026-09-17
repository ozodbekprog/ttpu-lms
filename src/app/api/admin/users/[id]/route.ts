import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userSelect } from "../select";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
  groupId: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ ok: false, error: "Foydalanuvchi topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;

  if (parsed.data.isActive !== undefined) {
    if (id === user.id && !parsed.data.isActive) {
      return Response.json({ ok: false, error: "O'zingizni bloklay olmaysiz" }, { status: 400 });
    }
    data.isActive = parsed.data.isActive;
  }

  if (parsed.data.groupId !== undefined) {
    if (parsed.data.groupId) {
      const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId } });
      if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 400 });
    }
    data.group = parsed.data.groupId ? { connect: { id: parsed.data.groupId } } : { disconnect: true };
  }

  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.toLowerCase();
    if (email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return Response.json({ ok: false, error: "Bu email band" }, { status: 409 });
      data.email = email;
    }
  }

  if (parsed.data.password !== undefined) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const updated = await prisma.user.update({ where: { id }, data, select: userSelect });
  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  if (id === user.id) {
    return Response.json({ ok: false, error: "O'zingizni o'chira olmaysiz" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ ok: false, error: "Foydalanuvchi topilmadi" }, { status: 404 });

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return Response.json({ ok: true, data: { id, isActive: false } });
}
