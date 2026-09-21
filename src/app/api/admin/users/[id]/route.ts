import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";
import { userSelect } from "../select";
import { verifyCsrfFromRequest } from "@/lib/csrf";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(12).max(100).optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
  groupId: z.string().trim().min(1).nullable().optional(),
  subGroupId: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

const LAST_ADMIN_ERROR = "Oxirgi adminni o'chirib/pasaytirib bo'lmaydi";

async function countActiveAdmins() {
  return prisma.user.count({ where: { role: "ADMIN", isActive: true } });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const csrfValid = await verifyCsrfFromRequest(request);
  if (!csrfValid) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ ok: false, error: "Foydalanuvchi topilmadi" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }

  const changesOther =
    (parsed.data.name !== undefined && parsed.data.name !== target.name) ||
    (parsed.data.email !== undefined && parsed.data.email.toLowerCase() !== target.email) ||
    parsed.data.password !== undefined ||
    (parsed.data.role !== undefined && parsed.data.role !== target.role) ||
    (parsed.data.groupId !== undefined && (parsed.data.groupId ?? null) !== target.groupId) ||
    (parsed.data.subGroupId !== undefined && (parsed.data.subGroupId ?? null) !== target.subGroupId);

  if (!target.isActive && (parsed.data.isActive !== true || changesOther)) {
    return Response.json(
      { ok: false, error: "Foydalanuvchi nofaol — avval faollashtiring" },
      { status: 400 },
    );
  }

  if (id === user.id) {
    if (parsed.data.role !== undefined && parsed.data.role !== "ADMIN") {
      return Response.json({ ok: false, error: "O'z rolingizni pasaytira olmaysiz" }, { status: 400 });
    }
    if (parsed.data.isActive === false) {
      return Response.json({ ok: false, error: "O'zingizni bloklay olmaysiz" }, { status: 400 });
    }
  }

  const demotes = parsed.data.role !== undefined && parsed.data.role !== "ADMIN";
  const deactivates = parsed.data.isActive === false;
  if (target.role === "ADMIN" && (demotes || deactivates)) {
    if ((await countActiveAdmins()) <= 1) {
      return Response.json({ ok: false, error: LAST_ADMIN_ERROR }, { status: 400 });
    }
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;

  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  if (parsed.data.groupId !== undefined) {
    if (parsed.data.groupId) {
      const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId } });
      if (!group) return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 400 });
    }
    data.group = parsed.data.groupId ? { connect: { id: parsed.data.groupId } } : { disconnect: true };
    if ((parsed.data.groupId ?? null) !== target.groupId) {
      data.subGroup = { disconnect: true };
    }
  }

  if (parsed.data.subGroupId !== undefined) {
    if (parsed.data.subGroupId) {
      const subGroup = await prisma.subGroup.findUnique({
        where: { id: parsed.data.subGroupId },
        select: { id: true, groupId: true },
      });
      if (!subGroup) return Response.json({ ok: false, error: "Kichik guruh topilmadi" }, { status: 400 });
      const nextGroupId = parsed.data.groupId !== undefined ? parsed.data.groupId : target.groupId;
      if (!nextGroupId || subGroup.groupId !== nextGroupId) {
        return Response.json({ ok: false, error: "Kichik guruh boshqa guruhga tegishli" }, { status: 400 });
      }
      data.subGroup = { connect: { id: subGroup.id } };
    } else {
      data.subGroup = { disconnect: true };
    }
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

  const roleChanged = parsed.data.role !== undefined && parsed.data.role !== target.role;
  const activeChanged = parsed.data.isActive !== undefined && parsed.data.isActive !== target.isActive;
  if (roleChanged || activeChanged) {
    await logAudit({
      actorId: user.id,
      action: "admin.user.update",
      entity: "User",
      entityId: id,
      meta: {
        role: parsed.data.role ?? target.role,
        isActive: parsed.data.isActive ?? target.isActive,
        previousRole: target.role,
        previousIsActive: target.isActive,
      },
    });
  }

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const csrfValid = await verifyCsrfFromRequest(_request);
  if (!csrfValid) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (id === user.id) {
    return Response.json({ ok: false, error: "O'zingizni o'chira olmaysiz" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ ok: false, error: "Foydalanuvchi topilmadi" }, { status: 404 });

  if (target.role === "ADMIN") {
    if ((await countActiveAdmins()) <= 1) {
      return Response.json({ ok: false, error: LAST_ADMIN_ERROR }, { status: 400 });
    }
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await logAudit({
    actorId: user.id,
    action: "admin.user.update",
    entity: "User",
    entityId: id,
    meta: { role: target.role, isActive: false, previousIsActive: target.isActive },
  });
  return Response.json({ ok: true, data: { id, isActive: false } });
}
