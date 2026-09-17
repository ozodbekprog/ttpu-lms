import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const DUMMY_HASH = "$2b$10$vabGzMWs78G4gDK4w4uNiO.wWPeTboNzwBwuVLU5Ht1xJQBWXtiZS";

type AttemptRecord = { count: number; resetAt: number };

const attempts = new Map<string, AttemptRecord>();

function pruneAttempts(now: number) {
  for (const [key, record] of attempts) {
    if (record.resetAt <= now) attempts.delete(key);
  }
}

function isRateLimited(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  pruneAttempts(now);
  const record = attempts.get(key);
  if (!record) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (record.count >= maxAttempts) return true;
  record.count += 1;
  return false;
}

function clearAttempts(key: string) {
  attempts.delete(key);
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Email va parolni to'g'ri kiriting" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const limitKey = `limit:login:${getClientIp(request)}:${email}`;
  if (isRateLimited(limitKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return Response.json(
      { ok: false, error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await bcrypt.compare(parsed.data.password, DUMMY_HASH);
    return Response.json({ ok: false, error: "Email yoki parol xato" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return Response.json({ ok: false, error: "Email yoki parol xato" }, { status: 401 });
  }

  clearAttempts(limitKey);
  await createSession(user);
  return Response.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role },
  });
}
