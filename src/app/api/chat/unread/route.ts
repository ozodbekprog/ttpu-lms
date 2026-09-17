import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.message.count({
    where: {
      senderId: { not: user.id },
      isRead: false,
      conversation: { OR: [{ participantAId: user.id }, { participantBId: user.id }] },
    },
  });

  return Response.json({ ok: true, data: { count } });
}
