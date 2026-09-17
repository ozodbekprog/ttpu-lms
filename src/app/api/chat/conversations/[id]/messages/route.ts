import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sendSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

const lastSentAt = new Map<string, number>();
const SEND_INTERVAL_MS = 1000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, participantAId: true, participantBId: true },
  });
  if (!conversation) {
    return Response.json({ ok: false, error: "Suhbat topilmadi" }, { status: 404 });
  }
  if (conversation.participantAId !== user.id && conversation.participantBId !== user.id) {
    return Response.json({ ok: false, error: "Ruxsat yo'q" }, { status: 403 });
  }

  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  messages.reverse();

  return Response.json({ ok: true, data: { messages } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, participantAId: true, participantBId: true },
  });
  if (!conversation) {
    return Response.json({ ok: false, error: "Suhbat topilmadi" }, { status: 404 });
  }
  if (conversation.participantAId !== user.id && conversation.participantBId !== user.id) {
    return Response.json({ ok: false, error: "Ruxsat yo'q" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Xabar 1-2000 belgi orasida bo'lishi kerak" },
      { status: 400 },
    );
  }

  const now = Date.now();
  const previous = lastSentAt.get(user.id) ?? 0;
  if (now - previous < SEND_INTERVAL_MS) {
    return Response.json(
      { ok: false, error: "Juda tez yuborilmoqda. Bir oz kuting" },
      { status: 429 },
    );
  }
  lastSentAt.set(user.id, now);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: id, senderId: user.id, body: parsed.data.body },
    }),
    prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return Response.json({ ok: true, data: { message } }, { status: 201 });
}
