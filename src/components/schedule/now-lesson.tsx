"use client";

import { useEffect, useState } from "react";
import { Badge, Card, CardBody } from "@/components/ui";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { cn } from "@/lib/utils";
import type { ScheduleEntryItem } from "./types";

type SlotRange = { start: number; end: number };

function parseClock(value: string): number | null {
  const [hours, minutes] = value.split(":");
  if (hours === undefined || minutes === undefined) return null;
  const h = Number(hours);
  const m = Number(minutes);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return h * 60 + m;
}

function slotRange(slot: number): SlotRange | null {
  const label = SLOT_TIMES[slot];
  if (!label) return null;
  const [from, to] = label.split("–");
  if (!from || !to) return null;
  const start = parseClock(from);
  const end = parseClock(to);
  if (start === null || end === null) return null;
  return { start, end };
}

function currentMinutes(): number {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
}

export function NowLesson({
  entries,
  today,
  isCurrentWeek,
  nowMinutes,
}: {
  entries: ScheduleEntryItem[];
  today: number;
  isCurrentWeek: boolean;
  nowMinutes: number;
}) {
  const [now, setNow] = useState(nowMinutes);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(currentMinutes()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isCurrentWeek) return null;

  const lessons = entries
    .filter((entry) => entry.dayOfWeek === today && entry.status !== "CANCELLED")
    .map((entry) => ({ entry, range: slotRange(entry.slot) }))
    .filter((item): item is { entry: ScheduleEntryItem; range: SlotRange } => item.range !== null)
    .sort((a, b) => a.range.start - b.range.start);

  const current = lessons.find((item) => item.range.start <= now && now < item.range.end);
  const upcoming = lessons.find((item) => item.range.start > now);
  const active = current ?? upcoming ?? null;

  if (!active) {
    return (
      <Card className="animate-fade-up overflow-hidden">
        <CardBody className="flex items-center gap-3 py-4">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Bugun darslar tugadi</p>
            <p className="text-xs text-slate-400">Keyingi darslar jadvalini hafta navigatsiyasidan tanlang</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const timeLabel = SLOT_TIMES[active.entry.slot] ?? `${active.entry.slot}-par`;
  const left = Math.max(0, active.range.end - now);
  const untilStart = Math.max(0, active.range.start - now);
  const metaLine = [active.entry.room, active.entry.teacher].filter(Boolean).join(" · ");

  return (
    <Card className={cn("animate-fade-up overflow-hidden", current ? "border-emerald-200/70" : "border-brand-200/70")}>
      <CardBody className="flex flex-wrap items-center gap-4 py-4">
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-2xl",
            current ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-700",
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={current ? "green" : "blue"}>{current ? "Hozir" : "Keyingi dars"}</Badge>
            <span className="text-xs text-slate-400">{timeLabel}</span>
            {current ? (
              <span className="text-xs font-medium text-emerald-600">Tugashiga {left} daqiqa</span>
            ) : (
              <span className="text-xs font-medium text-brand-700">Boshlanishiga {untilStart} daqiqa</span>
            )}
          </div>
          <p className="mt-1 truncate text-base font-semibold text-slate-900">{active.entry.subject}</p>
          {metaLine ? <p className="mt-0.5 truncate text-sm text-slate-500">{metaLine}</p> : null}
        </div>
      </CardBody>
    </Card>
  );
}
