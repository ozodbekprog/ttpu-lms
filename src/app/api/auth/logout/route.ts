import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function POST(request: Request) {
  const clientInfo = getClientInfo(request);
  const session = await getSession();
  if (session) {
    await prisma.user.updateMany({
      where: { id: session.uid },
      data: { sessionEpoch: { increment: 1 } },
    });
    await createAuditLog({
      action: "LOGOUT",
      entity: "User",
      entityId: session.uid,
      meta: { email: session.email, role: session.role },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
  }
  await destroySession();
  // Nisbiy Location ishlatiladi: `-H 0.0.0.0` bilan ishga tushganda
  // request.url bog'lanish manzilini (0.0.0.0) beradi va brauzer uni ocholmaydi.
  return new Response(null, {
    status: 303,
    headers: { Location: "/login" },
  });
}