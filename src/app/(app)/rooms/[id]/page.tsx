import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, Card, CardBody, PageHeader } from "@/components/ui";
import { cn, dayName, fmtDate } from "@/lib/utils";
import { dayNumberForIso, getRoomUsage } from "@/components/rooms/room-data";
import { dayIsoInWeek, formatDayShort, resolveWeekStart, shiftWeek } from "@/components/rooms/room-week";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

function groupByCell<T extends { slot: number }>(items: T[], dayOf: (item: T) => number) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = `${dayOf(item)}-${item.slot}`;
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

export default async function RoomUsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { week: weekParam } = await searchParams;

  const room = await prisma.room.findUnique({
    where: { id },
    select: { id: true, name: true, building: true, capacity: true, equipment: true },
  });
  if (!room) notFound();

  const week = resolveWeekStart(typeof weekParam === "string" ? weekParam : null);
  const usage = await getRoomUsage(room.name, week);
  const scheduleCells = groupByCell(usage.schedule, (item) => item.dayOfWeek);
  const bookingCells = groupByCell(usage.bookings, (item) => dayNumberForIso(item.date));
  const weekEnd = dayIsoInWeek(week, 6);

  const details = [
    room.building,
    room.capacity === null ? null : `${room.capacity} o'rin`,
    room.equipment,
  ]
    .filter(Boolean)
    .join(" · ");

  const lessonCount = usage.schedule.length;
  const bookingCount = usage.bookings.length;

  return (
    <>
      <PageHeader
        eyebrow="Xona bandligi"
        title={room.name}
        subtitle={details || "Ma'lumot kiritilmagan"}
        action={
          <ButtonLink href="/rooms" variant="secondary" size="sm">
            Xonalar ro&apos;yxati
          </ButtonLink>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-brand-300 bg-brand-100" />
            Dars
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-gold-400 bg-gold-300/40" />
            Bron
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded border border-dashed border-slate-300 bg-slate-50" />
            Bo&apos;sh
          </span>
          <span className="text-slate-600">
            {lessonCount} ta dars · {bookingCount} ta bron
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href={`/rooms/${room.id}?week=${shiftWeek(week, -1)}`} variant="secondary" size="sm">
            Oldingi hafta
          </ButtonLink>
          <ButtonLink href={`/rooms/${room.id}?week=${shiftWeek(week, 1)}`} variant="secondary" size="sm">
            Keyingi hafta
          </ButtonLink>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardBody className="overflow-x-auto p-3 sm:p-4">
          <div className="min-w-[900px]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">
                {fmtDate(week)} – {fmtDate(weekEnd)}
              </p>
            </div>
            <div className="grid grid-cols-[76px_repeat(6,minmax(0,1fr))] gap-1.5">
              <div className="flex items-center justify-center rounded-xl bg-slate-100/70 px-1 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Par
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="rounded-xl bg-slate-50 px-2 py-2 text-center ring-1 ring-slate-100"
                >
                  <p className="text-xs font-semibold text-slate-700">{dayName(day)}</p>
                  <p className="text-[10px] text-slate-600">{formatDayShort(dayIsoInWeek(week, day))}</p>
                </div>
              ))}

              {SLOTS.map((slot) => (
                <Fragment key={slot}>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-1 py-2 text-center ring-1 ring-slate-100">
                    <span className="text-xs font-semibold text-slate-700">{slot}-par</span>
                    <span className="mt-0.5 text-[10px] leading-tight text-slate-600">
                      {SLOT_TIMES[slot]}
                    </span>
                  </div>
                  {DAYS.map((day) => {
                    const key = `${day}-${slot}`;
                    const lessons = scheduleCells.get(key) ?? [];
                    const dayBookings = bookingCells.get(key) ?? [];
                    const dayIso = dayIsoInWeek(week, day);
                    const occupied = lessons.length > 0 || dayBookings.length > 0;
                    return (
                      <div
                        key={`${key}-cell`}
                        className={cn(
                          "flex min-h-24 flex-col gap-1.5 rounded-xl border p-1.5",
                          occupied
                            ? "border-slate-200 bg-white"
                            : "border-dashed border-slate-200 bg-slate-50/70",
                        )}
                      >
                        {lessons.map((lesson, index) => (
                          <div
                            key={`lesson-${index}`}
                            className="rounded-lg border border-brand-200 bg-brand-50/80 px-2 py-1.5"
                          >
                            <p className="truncate text-[11px] font-semibold text-brand-900">
                              {lesson.subject}
                            </p>
                            <p className="truncate text-[10px] text-brand-700">
                              {lesson.groupName}
                              {lesson.teacher ? ` · ${lesson.teacher}` : ""}
                            </p>
                          </div>
                        ))}
                        {dayBookings.map((booking, index) => (
                          <div
                            key={`booking-${index}`}
                            className="rounded-lg border border-gold-300 bg-gold-300/20 px-2 py-1.5"
                          >
                            <p className="truncate text-[11px] font-semibold text-gold-800">
                              {booking.purpose ?? "Bron"}
                            </p>
                            <p className="truncate text-[10px] text-gold-800">{booking.userName}</p>
                          </div>
                        ))}
                        {!occupied ? (
                          <div className="flex flex-1 flex-col items-center justify-center gap-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                              Bo&apos;sh
                            </span>
                            <Link
                              href={`/bookings?room=${encodeURIComponent(room.name)}&date=${dayIso}&slot=${slot}`}
                              className="rounded-lg bg-brand-900 px-2 py-1 text-[10px] font-medium text-white transition-colors duration-150 hover:bg-brand-800"
                            >
                              Bron qilish
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
