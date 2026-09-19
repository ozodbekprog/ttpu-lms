import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { hasScheduleConflict } from "@/components/rooms/room-data";

const createSchema = z.object({
  roomName: z.string().trim().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.number().int().min(1).max(8),
  purpose: z.string().trim().max(300).nullish(),
});

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  room: z.string().trim().min(1).max(100).optional(),
});

function parseDay(value: string) {
  const day = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(day.getTime()) ? null : day;
}

const bookingInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      group: { select: { name: true } },
    },
  },
} satisfies Prisma.RoomBookingInclude;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawDate = url.searchParams.get("date");
  const rawRoom = url.searchParams.get("room");
  const parsed = querySchema.safeParse({
    date: rawDate && rawDate.trim() ? rawDate.trim() : undefined,
    room: rawRoom && rawRoom.trim() ? rawRoom.trim() : undefined,
  });
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Filter noto'g'ri" }, { status: 400 });
  }

  const day = parsed.data.date ? parseDay(parsed.data.date) : null;
  if (parsed.data.date && !day) {
    return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
  }

  const bookings = await prisma.roomBooking.findMany({
    where: {
      ...(isStaff(user.role) ? {} : { userId: user.id }),
      ...(day ? { date: day } : {}),
      ...(parsed.data.room
        ? { roomName: { contains: parsed.data.room, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ date: "desc" }, { slot: "asc" }],
    include: bookingInclude,
  });

  return Response.json({ ok: true, data: { bookings } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Ma'lumotlar noto'g'ri to'ldirilgan" }, { status: 400 });
  }
  const data = parsed.data;

  const day = parseDay(data.date);
  if (!day) {
    return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
  }

  const conflict = await prisma.roomBooking.findFirst({
    where: {
      roomName: { equals: data.roomName, mode: "insensitive" },
      date: day,
      slot: data.slot,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (conflict) {
    return Response.json({ ok: false, error: "Bu vaqt band" }, { status: 409 });
  }

  const lessonConflict = await hasScheduleConflict(data.roomName, data.date, data.slot);
  if (lessonConflict) {
    return Response.json({ ok: false, error: "Bu vaqtda dars bor" }, { status: 409 });
  }

  const booking = await prisma.roomBooking.create({
    data: {
      roomName: data.roomName,
      date: day,
      slot: data.slot,
      purpose: data.purpose ? data.purpose : null,
      status: "ACTIVE",
      userId: user.id,
    },
    include: bookingInclude,
  });

  return Response.json({ ok: true, data: booking }, { status: 201 });
}
