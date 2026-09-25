"use client";

import { useEffect, useState } from "react";
import { Badge, Card, CardBody } from "@/components/ui";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { cn } from "@/lib/utils";
import type { ScheduleEntryItem } from "./types";

type SlotRange = { start: number; end: number };
type IconProps = { className?: string };

function ClockIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PinIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

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
      <Card className="animate-fade-up relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
        <CardBody className="flex items-center gap-3 py-4">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <CheckIcon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Bugun darslar tugadi</p>
            <p className="text-xs text-slate-600">Keyingi darslar jadvalini hafta navigatsiyasidan tanlang</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const timeLabel = SLOT_TIMES[active.entry.slot] ?? `${active.entry.slot}-par`;
  const [fromLabel, toLabel] = timeLabel.split("–");
  const total = Math.max(1, active.range.end - active.range.start);
  const progress = current ? Math.min(100, Math.max(0, ((now - active.range.start) / total) * 100)) : 0;
  const left = Math.max(0, active.range.end - now);
  const untilStart = Math.max(0, active.range.start - now);
  const metaLine = [active.entry.room, active.entry.teacher].filter(Boolean).join(" · ");

  return (
    <Card
      className={cn(
        "animate-fade-up relative overflow-hidden",
        current ? "border-emerald-200/70" : "border-brand-200/70",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r",
          current ? "from-emerald-400 via-emerald-500 to-teal-400" : "from-brand-500 via-brand-400 to-gold-400",
        )}
      />
      <CardBody className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={cn(
              "relative inline-flex size-11 shrink-0 items-center justify-center rounded-2xl",
              current ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-700",
            )}
          >
            {current ? <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-emerald-400/30" /> : null}
            <ClockIcon className="relative size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={current ? "green" : "blue"} className="gap-1.5">
                {current ? <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> : null}
                {current ? "Hozir" : "Keyingi dars"}
              </Badge>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {timeLabel}
              </span>
              <span className={cn("text-xs font-medium", current ? "text-emerald-600" : "text-brand-700")}>
                {current ? `Tugashiga ${left} daqiqa` : `Boshlanishiga ${untilStart} daqiqa`}
              </span>
            </div>
            <p className="mt-1 truncate text-base font-semibold text-slate-900">{active.entry.subject}</p>
            {metaLine ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 truncate text-sm text-slate-500">
                {active.entry.room ? (
                  <span className="inline-flex items-center gap-1">
                    <PinIcon className="text-slate-600" />
                    {active.entry.room}
                  </span>
                ) : null}
                {active.entry.teacher ? <span>{active.entry.teacher}</span> : null}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-3.5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>{fromLabel}</span>
            <span className={cn("font-medium", current ? "text-emerald-600" : "text-brand-600")}>
              {current ? `${Math.round(progress)}% bajarildi` : "kutilmoqda"}
            </span>
            <span>{toLabel}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                current
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "w-1/4 animate-pulse bg-gradient-to-r from-brand-300 to-brand-400",
              )}
              style={current ? { width: `${progress}%` } : undefined}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
