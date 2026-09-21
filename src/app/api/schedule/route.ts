import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageEntry } from "./_helpers";
import { verifyCsrfFromRequest } from "@/lib/csrf";

const createSchema = z.object({
  groupId: z.string().trim().min(1),
  dayOfWeek: z.number().int().min(1).max(6),
  slot: z.number().int().min(1).max(8),
  subject: z.string().trim().min(1).max(200),
  subjectId: z.string().cuid().nullish(),
  lessonType: z.string().max(40).nullish(),
  teacher: z.string().trim().max(200).nullish(),
  teacherId: z.string().cuid().nullish(),
  room: z.string().trim().max(100).nullish(),
  parity: z.enum(["odd", "even"]).nullish(),
  subGroup: z.string().trim().max(20).nullish(),
  status: z.enum(["NORMAL", "CHANGED", "MOVED", "CANCELLED"]).optional(),
  note: z.string().trim().max(300).nullish(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("groupId") ?? (user.role === "STUDENT" ? user.groupId : null);
  const parsed = z.string().trim().min(1).safeParse(raw);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "groupId ko'rsatilmagan" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({
    where: { id: parsed.data },
    select: { id: true, name: true },
  });
  if (!group) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: { groupId: group.id },
    orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
    include: {
      subjectRef: { select: { name: true, color: true } },
      teacherRef: { select: { id: true, name: true } },
    },
  });

  return Response.json({ ok: true, data: { group, entries } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const csrfValid = await verifyCsrfFromRequest(request);
  if (!csrfValid) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar noto'g'ri to'ldirilgan" }, { status: 400 });
  }
  const data = parsed.data;

  const group = await prisma.group.findUnique({ where: { id: data.groupId }, select: { id: true } });
  if (!group) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  if (!canManageEntry(user, { teacherId: data.teacherId ?? null, teacher: data.teacher ?? null })) {
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

  const parity = data.parity ?? null;
  const conflict = await prisma.scheduleEntry.findFirst({
    where: {
      groupId: data.groupId,
      dayOfWeek: data.dayOfWeek,
      slot: data.slot,
      ...(parity === null ? {} : { OR: [{ parity: null }, { parity }] }),
    },
    select: { id: true },
  });
  if (conflict) {
    return Response.json({ ok: false, error: "Bu vaqtda guruhda dars mavjud" }, { status: 409 });
  }

  const entry = await prisma.scheduleEntry.create({
    data: {
      groupId: data.groupId,
      dayOfWeek: data.dayOfWeek,
      slot: data.slot,
      subject: data.subject,
      subjectId: data.subjectId ?? null,
      lessonType: data.lessonType ? data.lessonType : null,
      teacher: data.teacher ? data.teacher : null,
      teacherId: data.teacherId ?? null,
      room: data.room ? data.room : null,
      parity,
      subGroup: data.subGroup ? data.subGroup : null,
      status: data.status ?? "NORMAL",
      note: data.note ? data.note : null,
    },
    include: {
      subjectRef: { select: { name: true, color: true } },
      teacherRef: { select: { id: true, name: true } },
    },
  });

  return Response.json({ ok: true, data: entry }, { status: 201 });
}
