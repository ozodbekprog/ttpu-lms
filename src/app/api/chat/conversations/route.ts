import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  userId: z.string().min(1),
});

const USER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  role: true,
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ participantAId: user.id }, { participantBId: user.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participantA: { select: USER_SELECT },
      participantB: { select: USER_SELECT },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  const ids = conversations.map((conversation) => conversation.id);
  const unreadRows = ids.length
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: ids },
          senderId: { not: user.id },
          isRead: false,
        },
        _count: { _all: true },
      })
    : [];
  const unreadMap = new Map(unreadRows.map((row) => [row.conversationId, row._count._all]));

  const data = conversations.map((conversation) => ({
    id: conversation.id,
    participant:
      conversation.participantAId === user.id ? conversation.participantB : conversation.participantA,
    lastMessage: conversation.messages[0] ?? null,
    unreadCount: unreadMap.get(conversation.id) ?? 0,
  }));

  return Response.json({ ok: true, data: { conversations: data } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar noto'g'ri" }, { status: 400 });
  }

  const targetId = parsed.data.userId;
  if (targetId === user.id) {
    return Response.json({ ok: false, error: "O'zingizga suhbat ochib bo'lmaydi" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { ...USER_SELECT, isActive: true },
  });
  if (!target || !target.isActive) {
    return Response.json({ ok: false, error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }

  const [participantAId, participantBId] =
    user.id < target.id ? [user.id, target.id] : [target.id, user.id];
  const pair = { participantAId, participantBId };

  const existing = await prisma.conversation.findUnique({
    where: { participantAId_participantBId: pair },
  });

  let created = false;
  let conversationId = existing?.id ?? null;

  if (!conversationId) {
    try {
      const createdConversation = await prisma.conversation.create({ data: pair });
      conversationId = createdConversation.id;
      created = true;
    } catch {
      const fallback = await prisma.conversation.findUnique({
        where: { participantAId_participantBId: pair },
      });
      if (!fallback) {
        return Response.json({ ok: false, error: "Suhbat yaratilmadi" }, { status: 500 });
      }
      conversationId = fallback.id;
    }
  }

  return Response.json(
    {
      ok: true,
      data: {
        conversation: {
          id: conversationId,
          participant: {
            id: target.id,
            name: target.name,
            avatarUrl: target.avatarUrl,
            role: target.role,
          },
          lastMessage: null,
          unreadCount: 0,
        },
      },
    },
    { status: created ? 201 : 200 },
  );
}
