import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAppUrl, sendMail } from "@/server/mailer";

const schema = z.object({
  email: z.string().email(),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const TOKEN_TTL_MS = 30 * 60 * 1000;

type AttemptRecord = { count: number; resetAt: number };

const attempts = new Map<string, AttemptRecord>();

function pruneAttempts(now: number) {
  for (const [key, record] of attempts) {
    if (record.resetAt <= now) attempts.delete(key);
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  pruneAttempts(now);
  const record = attempts.get(key);
  if (!record) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_ATTEMPTS) return true;
  record.count += 1;
  return false;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Emailni to'g'ri kiriting" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const limitKey = `forgot:${getClientIp(request)}:${email}`;
  if (isRateLimited(limitKey)) {
    return Response.json(
      { ok: false, error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
      { status: 429 },
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
  }

  return Response.json({ ok: true });
}
