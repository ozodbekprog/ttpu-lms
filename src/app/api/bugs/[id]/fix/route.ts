import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyCsrfFromRequest } from "@/lib/csrf";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const actionSchema = z.object({
  action: z.enum(["request", "deploy", "cancel"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (!(await verifyCsrfFromRequest(request))) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Amal noto'g'ri" }, { status: 400 });
  }

  const report = await prisma.bugReport.findUnique({ where: { id } });
  if (!report) {
    return Response.json({ ok: false, error: "Xabar topilmadi" }, { status: 404 });
  }

  const meta = (report.meta ?? {}) as Record<string, unknown>;
  const existingFix = typeof meta.fix === "object" && meta.fix ? (meta.fix as Record<string, unknown>) : {};

  if (parsed.data.action === "cancel") {
    const fix = { ...existingFix, status: "cancelled" };
    const updated = await prisma.bugReport.update({ where: { id }, data: { meta: { ...meta, fix } } });
    return Response.json({ ok: true, data: { report: updated } });
  }

  if (parsed.data.action === "deploy") {
    if (existingFix.status !== "ready") {
      return Response.json(
        { ok: false, error: "Tayyor tuzatish yo'q — avval AI tuzatishi kerak" },
        { status: 400 },
      );
    }
    const fix = { ...existingFix, status: "deploying", deployRequestedAt: new Date().toISOString() };
    const updated = await prisma.bugReport.update({ where: { id }, data: { meta: { ...meta, fix } } });
    return Response.json({ ok: true, data: { report: updated } });
  }

  const fix = {
    status: "queued",
    requestedAt: new Date().toISOString(),
    requestedBy: user.name,
  };
  const updated = await prisma.bugReport.update({
    where: { id },
    data: { meta: { ...meta, fix }, status: "IN_REVIEW" },
  });

  const clientInfo = getClientInfo(request);
  await createAuditLog({
    action: "BUG_UPDATED",
    entity: "BugReport",
    entityId: id,
    meta: { fix: "requested" },
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });

  return Response.json({ ok: true, data: { report: updated } });
}
