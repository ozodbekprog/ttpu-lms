import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(12),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const clientInfo = getClientInfo(request);
  const limitKey = `reset:${getClientIp(request)}`;
  const rateLimit = await checkRateLimit(limitKey, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
    keyPrefix: "auth",
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "PASSWORD_RESET_FAILED",
      meta: { reason: "rate_limited" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return Response.json(
      { ok: false, error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Parol kamida 12 belgidan iborat bo'lishi kerak" },
      { status: 400 },
    );
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    await createAuditLog({
      action: "PASSWORD_RESET_FAILED",
      meta: { reason: "invalid_or_expired_token" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return Response.json(
      { ok: false, error: "Havola yaroqsiz yoki muddati o'tgan" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionEpoch: { increment: 1 } },
    }),
  ]);

  const resetUser = await prisma.user.findUnique({ where: { id: record.userId }, select: { email: true } });
  await createAuditLog({
    action: "PASSWORD_RESET_SUCCESS",
    entity: "User",
    entityId: record.userId,
    meta: { email: resetUser?.email ?? "unknown" },
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });

  return Response.json({ ok: true });
}