import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAppUrl, sendMail } from "@/server/mailer";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const clientInfo = getClientInfo(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Emailni to'g'ri kiriting" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const limitKey = `forgot:${getClientIp(request)}:${email}`;
  const rateLimit = await checkRateLimit(limitKey, {
    windowMs: WINDOW_MS,
    maxAttempts: MAX_ATTEMPTS,
    keyPrefix: "auth",
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "PASSWORD_RESET_REQUEST",
      meta: { email, reason: "rate_limited" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return Response.json(
      { ok: false, error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    const link = `${getAppUrl()}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: "TTPU LMS — parolni tiklash",
        text: `Parolni tiklash uchun havola: ${link}\n\nHavola 30 daqiqa amal qiladi. Agar siz so'ramagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.`,
      });
    } catch (error) {
      console.error("Email yuborishda xatolik:", error);
    }
    await createAuditLog({
      action: "PASSWORD_RESET_REQUEST",
      entity: "User",
      entityId: user.id,
      meta: { email, emailSent: true },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
  } else {
    await createAuditLog({
      action: "PASSWORD_RESET_REQUEST",
      meta: { email, reason: "user_not_found_or_inactive", emailSent: false },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
  }

  return Response.json({ ok: true });
}