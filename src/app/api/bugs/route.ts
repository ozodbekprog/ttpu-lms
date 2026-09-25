import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyCsrfFromRequest } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const reportSchema = z.object({
  message: z.string().trim().min(3).max(3000),
  stack: z.string().trim().max(8000).optional(),
  url: z.string().trim().max(600).optional(),
  note: z.string().trim().max(1500).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await verifyCsrfFromRequest(request))) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar to'g'ri emas" }, { status: 400 });
  }

  const clientInfo = getClientInfo(request);
  const rateLimit = await checkRateLimit(`bugs:${user.id}`, {
    windowMs: 60 * 60 * 1000,
    maxAttempts: 10,
    keyPrefix: "bugs",
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { ok: false, error: "Juda ko'p murojaat. Keyinroq urinib ko'ring" },
      { status: 429 },
    );
  }

  const report = await prisma.bugReport.create({
    data: {
      userId: user.id,
      url: parsed.data.url ?? null,
      message: parsed.data.message,
      stack: parsed.data.stack ?? null,
      meta: {
        note: parsed.data.note ?? null,
        userName: user.name,
        userRole: user.role,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
      },
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "Yangi xatolik xabari",
        body: parsed.data.message.slice(0, 180),
        link: "/admin/bugs",
      })),
    });
  }

  await createAuditLog({
    action: "BUG_REPORTED",
    entity: "BugReport",
    entityId: report.id,
    meta: { url: parsed.data.url ?? null, role: user.role },
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });

  return Response.json({ ok: true, data: { id: report.id } }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.bugReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { id: true, name: true, role: true, email: true } } },
  });

  return Response.json({ ok: true, data: { reports } });
}
