import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(12).max(100),
});

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_ATTEMPTS = 5;

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const clientInfo = getClientInfo(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Ma'lumotlar to'liq emas (parol kamida 12 belgi)" },
      { status: 400 },
    );
  }

  const limitKey = `register:${getClientIp(request)}`;
  const rateLimit = await checkRateLimit(limitKey, {
    windowMs: REGISTER_WINDOW_MS,
    maxAttempts: REGISTER_MAX_ATTEMPTS,
    keyPrefix: "auth",
  });

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "REGISTER",
      meta: { reason: "rate_limited" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return Response.json(
      { ok: false, error: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  if (exists) {
    await createAuditLog({
      action: "REGISTER",
      meta: { email, reason: "email_already_exists" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    await prisma.user.create({
      data: { name: parsed.data.name.trim(), email, passwordHash, role: "STUDENT", isActive: false },
    }).catch(() => {});
    return Response.json({ ok: true, user: { id: "exists", name: "", role: "STUDENT" } }, { status: 201 });
  }

  const user = await prisma.user.create({
    data: { name: parsed.data.name.trim(), email, passwordHash, role: "STUDENT" },
  });

  await createSession(user);
  await createAuditLog({
    action: "REGISTER",
    entity: "User",
    entityId: user.id,
    meta: { email, role: user.role },
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });
  return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
}