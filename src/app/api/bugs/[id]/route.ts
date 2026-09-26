import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyCsrfFromRequest } from "@/lib/csrf";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "FIXED", "REJECTED"]).optional(),
  adminNote: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
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
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar to'g'ri emas" }, { status: 400 });
  }

  const existing = await prisma.bugReport.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ ok: false, error: "Xabar topilmadi" }, { status: 404 });
  }

  const report = await prisma.bugReport.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.adminNote !== undefined ? { adminNote: parsed.data.adminNote } : {}),
    },
  });

  const clientInfo = getClientInfo(request);
  await createAuditLog({
    action: "BUG_UPDATED",
    entity: "BugReport",
    entityId: report.id,
    meta: { status: report.status },
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });

  return Response.json({ ok: true, data: { report } });
}
