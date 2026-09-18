import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyGroupStudents } from "@/server/notify";
import { canManageEntry } from "../_helpers";

const updateSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(6).optional(),
  slot: z.number().int().min(1).max(8).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  subjectId: z.string().cuid().nullish(),
  lessonType: z.string().max(40).nullish(),
  teacher: z.string().trim().max(200).nullish(),
  teacherId: z.string().cuid().nullish(),
  room: z.string().trim().max(100).nullish(),
  parity: z.enum(["odd", "even"]).nullish(),
  status: z.enum(["NORMAL", "CHANGED", "MOVED", "CANCELLED"]).optional(),
  note: z.string().trim().max(300).nullish(),
});

const STATUS_TITLES = {
  NORMAL: "Dars tiklandi",
  CHANGED: "Dars o'zgardi",
  MOVED: "Dars ko'chirildi",
  CANCELLED: "Dars bekor qilindi",
} as const;

const DAY_NAMES = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return { user: null, error: Response.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar noto'g'ri to'ldirilgan" }, { status: 400 });
  }
  const data = parsed.data;

  const entry = await prisma.scheduleEntry.findUnique({ where: { id } });
  if (!entry) {
    return Response.json({ ok: false, error: "Jadval yozuvi topilmadi" }, { status: 404 });
  }

  if (!canManageEntry(guard.user, entry)) {
    return Response.json({ ok: false, error: "Bu jadval yozuvini o'zgartirish huquqingiz yo'q" }, { status: 403 });
  }

  if (data.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId }, select: { id: true } });
    if (!subject) {
      return Response.json({ ok: false, error: "Fan topilmadi" }, { status: 400 });
    }
  }

  if (data.teacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: data.teacherId }, select: { id: true } });
    if (!teacher) {
      return Response.json({ ok: false, error: "O'qituvchi topilmadi" }, { status: 400 });
    }
  }

  const nextDayOfWeek = data.dayOfWeek ?? entry.dayOfWeek;
  const nextSlot = data.slot ?? entry.slot;
  const nextParity = data.parity === undefined ? entry.parity : data.parity;

  const conflict = await prisma.scheduleEntry.findFirst({
    where: {
      id: { not: id },
      groupId: entry.groupId,
      dayOfWeek: nextDayOfWeek,
      slot: nextSlot,
      ...(nextParity === null ? {} : { OR: [{ parity: null }, { parity: nextParity }] }),
    },
    select: { id: true },
  });
  if (conflict) {
    return Response.json({ ok: false, error: "Bu vaqtda guruhda boshqa dars mavjud" }, { status: 409 });
  }

  const updated = await prisma.scheduleEntry.update({
    where: { id },
    data: {
      ...(data.dayOfWeek !== undefined ? { dayOfWeek: data.dayOfWeek } : {}),
      ...(data.slot !== undefined ? { slot: data.slot } : {}),
      ...(data.subject !== undefined ? { subject: data.subject } : {}),
      ...(data.subjectId !== undefined ? { subjectId: data.subjectId ?? null } : {}),
      ...(data.lessonType !== undefined ? { lessonType: data.lessonType ? data.lessonType : null } : {}),
      ...(data.teacher !== undefined ? { teacher: data.teacher ? data.teacher : null } : {}),
      ...(data.teacherId !== undefined ? { teacherId: data.teacherId ?? null } : {}),
      ...(data.room !== undefined ? { room: data.room ? data.room : null } : {}),
      ...(data.parity !== undefined ? { parity: data.parity ?? null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.note !== undefined ? { note: data.note ? data.note : null } : {}),
    },
    include: {
      subjectRef: { select: { name: true, color: true } },
      teacherRef: { select: { id: true, name: true } },
    },
  });

  if (data.status !== undefined && data.status !== entry.status) {
    const parts: string[] = [];
    if (updated.note) parts.push(updated.note);
    parts.push(`${DAY_NAMES[updated.dayOfWeek - 1]}, ${updated.slot}-par`);
    await notifyGroupStudents(updated.groupId, {
      title: `${STATUS_TITLES[data.status]}: ${updated.subject}`,
      body: data.status === "CANCELLED" ? parts.join(" · ") : undefined,
      link: "/schedule",
    });
  }

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const entry = await prisma.scheduleEntry.findUnique({
    where: { id },
    select: { id: true, teacher: true, teacherId: true },
  });
  if (!entry) {
    return Response.json({ ok: false, error: "Jadval yozuvi topilmadi" }, { status: 404 });
  }

  if (!canManageEntry(guard.user, entry)) {
    return Response.json({ ok: false, error: "Bu jadval yozuvini o'zgartirish huquqingiz yo'q" }, { status: 403 });
  }

  await prisma.scheduleEntry.delete({ where: { id } });

  return Response.json({ ok: true, data: { id } });
}
