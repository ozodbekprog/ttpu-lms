import { prisma } from "@/lib/prisma";
import {
  addDaysUtc,
  formatIsoDate,
  isoToUtcDate,
  isoWeekday,
  mondayOf,
  parityMatches,
  parseIsoDate,
  weekParityOf,
} from "@/components/rooms/room-week";

export type UsageScheduleItem = {
  dayOfWeek: number;
  slot: number;
  subject: string;
  groupName: string;
  teacher: string | null;
};

export type UsageBookingItem = {
  date: string;
  slot: number;
  purpose: string | null;
  userName: string;
  status: string;
};

export type RoomUsage = {
  schedule: UsageScheduleItem[];
  bookings: UsageBookingItem[];
};

export type AvailableRoom = {
  id: string;
  name: string;
  building: string | null;
};

export async function getRoomUsage(roomName: string, weekStartIso: string): Promise<RoomUsage> {
  const weekParity = weekParityOf(weekStartIso);
  const start = isoToUtcDate(weekStartIso);
  const end = addDaysUtc(start, 7);

  const [entries, bookings] = await Promise.all([
    prisma.scheduleEntry.findMany({
      where: {
        room: { equals: roomName, mode: "insensitive" },
        dayOfWeek: { in: [1, 2, 3, 4, 5, 6] },
      },
      include: {
        group: { select: { name: true } },
        teacherRef: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
    }),
    prisma.roomBooking.findMany({
      where: {
        roomName: { equals: roomName, mode: "insensitive" },
        date: { gte: start, lt: end },
        status: "ACTIVE",
      },
      include: { user: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { slot: "asc" }],
    }),
  ]);

  return {
    schedule: entries
      .filter((entry) => parityMatches(entry.parity, weekParity))
      .map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        slot: entry.slot,
        subject: entry.subject,
        groupName: entry.group.name,
        teacher: entry.teacher ?? entry.teacherRef?.name ?? null,
      })),
    bookings: bookings.map((booking) => ({
      date: booking.date.toISOString().slice(0, 10),
      slot: booking.slot,
      purpose: booking.purpose,
      userName: booking.user.name,
      status: booking.status,
    })),
  };
}

export async function findAvailableRooms(dateIso: string, slot: number): Promise<AvailableRoom[]> {
  const day = parseIsoDate(dateIso);
  if (!day) return [];

  const dayOfWeek = isoWeekday(day);
  const weekParity = weekParityOf(formatIsoDate(mondayOf(day)));
  const dayUtc = isoToUtcDate(dateIso);

  const [rooms, entries, bookings] = await Promise.all([
    prisma.room.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, building: true },
    }),
    prisma.scheduleEntry.findMany({
      where: { dayOfWeek, slot, room: { not: null } },
      select: { room: true, parity: true },
    }),
    prisma.roomBooking.findMany({
      where: { date: dayUtc, slot, status: "ACTIVE" },
      select: { roomName: true },
    }),
  ]);

  const busy = new Set<string>();
  for (const entry of entries) {
    if (entry.room && parityMatches(entry.parity, weekParity)) busy.add(entry.room.toLowerCase());
  }
  for (const booking of bookings) {
    busy.add(booking.roomName.toLowerCase());
  }

  return rooms.filter((room) => !busy.has(room.name.toLowerCase()));
}

export async function hasScheduleConflict(
  roomName: string,
  dateIso: string,
  slot: number,
): Promise<boolean> {
  const day = parseIsoDate(dateIso);
  if (!day) return false;
  const dayOfWeek = isoWeekday(day);
  if (dayOfWeek > 6) return false;
  const weekParity = weekParityOf(formatIsoDate(mondayOf(day)));

  const entries = await prisma.scheduleEntry.findMany({
    where: { room: { equals: roomName, mode: "insensitive" }, dayOfWeek, slot },
    select: { parity: true },
  });

  return entries.some((entry) => parityMatches(entry.parity, weekParity));
}

export function roomWeekIsoForDate(dateIso: string): string {
  const day = parseIsoDate(dateIso) ?? new Date();
  return formatIsoDate(mondayOf(day));
}

export function dayNumberForIso(dateIso: string): number {
  const day = parseIsoDate(dateIso);
  return day ? isoWeekday(day) : 0;
}
