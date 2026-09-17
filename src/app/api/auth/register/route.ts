import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_ATTEMPTS = 5;

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

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Ma'lumotlar to'liq emas (parol kamida 8 belgi)" },
      { status: 400 },
    );
  }

  const limitKey = `limit:register:${getClientIp(request)}`;
  if (isRateLimited(limitKey, REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS)) {
    return Response.json(
      { ok: false, error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
      { status: 429 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return Response.json({ ok: false, error: "Bu email bilan ro'yxatdan o'tib bo'lmaydi" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { name: parsed.data.name.trim(), email, passwordHash, role: "STUDENT" },
  });

  await createSession(user);
  return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
}
