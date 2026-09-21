import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { createSession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCsrfFromRequest } from "@/lib/csrf";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
  bio: z.string().max(300).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(100),
});

type ProfileUser = Prisma.UserGetPayload<{ include: { group: true } }>;

function publicUser(user: ProfileUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio,
    createdAt: user.createdAt,
    group: user.group ? { id: user.group.id, name: user.group.name } : null,
  };
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const csrfValid = await verifyCsrfFromRequest(request);
  if (!csrfValid) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (body && typeof body === "object" && ("currentPassword" in body || "newPassword" in body)) {
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ ok: false, error: "Parol ma'lumotlari xato" }, { status: 400 });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return Response.json({ ok: false, error: "Joriy parol noto'g'ri" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, sessionEpoch: { increment: 1 } },
      include: { group: true },
    });
    await createSession(updated);
    return Response.json({ ok: true, data: { user: publicUser(updated) } });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar xato" }, { status: 400 });
  }
  if (
    parsed.data.name === undefined &&
    parsed.data.avatarUrl === undefined &&
    parsed.data.bio === undefined
  ) {
    return Response.json({ ok: false, error: "O'zgartirish uchun maydon yuborilmadi" }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.avatarUrl !== undefined) {
    data.avatarUrl = parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl;
  }
  if (parsed.data.bio !== undefined) {
    data.bio = parsed.data.bio.trim() === "" ? null : parsed.data.bio;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    include: { group: true },
  });
  return Response.json({ ok: true, data: { user: publicUser(updated) } });
}
