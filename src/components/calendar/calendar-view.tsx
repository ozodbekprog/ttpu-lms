"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, ButtonLink, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { cn, dayName } from "@/lib/utils";

export type CalendarItem = {
  id: string;
  title: string;
  type: "assignment" | "quiz";
  courseId: string;
  courseTitle: string;
  dueAt: string;
};

type CalendarResponse =
  | { ok: true; data: { items: CalendarItem[] } }
  | { ok: false; error: string };

const MONTH_NAMES = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function dayKeyFromDate(date: Date): string {
  return dayKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}

function timeText(value: string): string {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function selectedDayTitle(key: string): string {
  const [yearText, monthText, dayText] = key.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return `${day} ${MONTH_NAMES[month - 1].toLowerCase()}, ${dayName(new Date(year, month - 1, day).getDay())}`;
}

export function CalendarView() {
  const today = useMemo(() => new Date(), []);
  const todayKey = dayKeyFromDate(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selected, setSelected] = useState<string | null>(todayKey);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = `${year}-${pad(month)}`;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/calendar?month=${monthKey}`, { cache: "no-store" });
        const json = (await response.json().catch(() => null)) as CalendarResponse | null;
        if (!active) return;
        if (!json || !json.ok) {
          setItems([]);
          setError(json && !json.ok ? json.error : "Ma'lumotlarni yuklab bo'lmadi");
          return;
        }
        setItems(json.data.items);
      } catch {
        if (!active) return;
        setItems([]);
        setError("Ma'lumotlarni yuklab bo'lmadi");
      } finally {
        if (active) setLoading(false);
      }
    };
    void Promise.resolve().then(load);
    return () => {
      active = false;
    };
  }, [monthKey]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = dayKeyFromDate(new Date(item.dueAt));
      const list = map.get(key);
      if (list) {
        list.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return map;
  }, [items]);

  const cells = useMemo(() => {
    const result: Array<number | null> = [];
    const offset = firstWeekday(year, month);
    const total = daysInMonth(year, month);
    for (let index = 0; index < offset; index += 1) result.push(null);
    for (let day = 1; day <= total; day += 1) result.push(day);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const selectedItems = selected ? itemsByDay.get(selected) ?? [] : [];

  function goToMonth(delta: number) {
    const target = new Date(year, month - 1 + delta, 1);
    setYear(target.getFullYear());
    setMonth(target.getMonth() + 1);
    setSelected(null);
  }

  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelected(todayKey);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`${MONTH_NAMES[month - 1]} ${year}`}
          subtitle={loading ? "Yuklanmoqda..." : `${items.length} ta muddat`}
          action={
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                aria-label="Oldingi oy"
                className="px-3 py-1.5 text-sm text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-800"
              >
                ←
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="border-x border-slate-200 px-3.5 py-1.5 text-sm font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50"
              >
                Bugun
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label="Keyingi oy"
                className="px-3 py-1.5 text-sm text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-800"
              >
                →
              </button>
            </div>
          }
        />
        <CardBody>
          {error ? (
            <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((name) => (
              <div
                key={name}
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {name}
              </div>
            ))}
            {cells.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-16 sm:min-h-20" />;
              }
              const key = dayKey(year, month, day);
              const dayItems = itemsByDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "flex min-h-16 flex-col items-start gap-1.5 rounded-xl border border-slate-100 bg-white p-1.5 text-left transition-all duration-150 hover:border-brand-200 hover:bg-brand-50/40 sm:min-h-20 sm:p-2",
                    isSelected && "border-brand-200 bg-brand-50/70 ring-1 ring-brand-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-sm",
                      isToday
                        ? "bg-brand-900 font-semibold text-white shadow-sm"
                        : "font-medium text-slate-600",
                    )}
                  >
                    {day}
                  </span>
                  {dayItems.length > 0 ? (
                    <span className="flex flex-wrap items-center gap-1 px-0.5">
                      {dayItems.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "size-1.5 rounded-full",
                            item.type === "quiz" ? "bg-brand-600" : "bg-amber-500",
                          )}
                        />
                      ))}
                      {dayItems.length > 4 ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          +{dayItems.length - 4}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-brand-600" /> Test
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-500" /> Topshiriq
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-900 text-[9px] font-semibold text-white">
                {today.getDate()}
              </span>
              Bugun
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={selected ? selectedDayTitle(selected) : "Kun tanlanmagan"}
          subtitle={
            selected && selectedItems.length > 0
              ? `${selectedItems.length} ta muddat`
              : "Deadline'lar ro'yxati"
          }
        />
        <CardBody className="space-y-3">
          {selected === null ? (
            <p className="text-sm text-slate-500">
              Kalendardan kunni tanlang — o&apos;sha kundagi muddatlar shu yerda ko&apos;rinadi.
            </p>
          ) : selectedItems.length === 0 ? (
            <EmptyState title="Bu kunda deadline yo'q" />
          ) : (
            selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-shadow duration-150 hover:shadow-lift"
              >
                <span
                  className={cn(
                    "h-10 w-1 shrink-0 rounded-full",
                    item.type === "quiz" ? "bg-brand-500" : "bg-amber-400",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.courseTitle}</p>
                </div>
                <Badge tone={item.type === "quiz" ? "brand" : "amber"}>
                  {item.type === "quiz" ? "Test" : "Topshiriq"}
                </Badge>
                <span className="text-xs font-semibold text-slate-700">{timeText(item.dueAt)}</span>
                {item.type === "quiz" ? (
                  <ButtonLink href={`/quizzes/${item.id}`} variant="secondary" size="sm">
                    Ko&apos;rish
                  </ButtonLink>
                ) : (
                  <ButtonLink href={`/courses/${item.courseId}`} variant="secondary" size="sm">
                    Kurs
                  </ButtonLink>
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
