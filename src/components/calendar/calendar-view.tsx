"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, ButtonLink, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { cn, dayName, fmtDateTime } from "@/lib/utils";

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
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => goToMonth(-1)}>
                ← Oldingi
              </Button>
              <Button variant="secondary" size="sm" onClick={goToToday}>
                Bugun
              </Button>
              <Button variant="secondary" size="sm" onClick={() => goToMonth(1)}>
                Keyingi →
              </Button>
            </div>
          }
        />
        <CardBody>
          {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((name) => (
              <div key={name} className="py-1 text-center text-xs font-medium text-slate-500">
                {name}
              </div>
            ))}
            {cells.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-16 rounded-lg" />;
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
                    "flex min-h-16 flex-col items-start gap-1.5 rounded-lg border p-1.5 text-left text-xs transition sm:p-2",
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isToday
                        ? "border-blue-300 bg-blue-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50",
                  )}
                >
                  <span className={cn("font-medium", isToday && !isSelected ? "text-blue-700" : "")}>
                    {day}
                  </span>
                  {dayItems.length > 0 ? (
                    <span className="flex flex-wrap items-center gap-1">
                      {dayItems.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={cn(
                            "size-1.5 rounded-full",
                            isSelected
                              ? "bg-white"
                              : item.type === "quiz"
                                ? "bg-blue-600"
                                : "bg-amber-500",
                          )}
                        />
                      ))}
                      {dayItems.length > 3 ? (
                        <span className={cn("text-[10px]", isSelected ? "text-white" : "text-slate-400")}>
                          +{dayItems.length - 3}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-blue-600" /> Test
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-500" /> Topshiriq
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={selected ? selectedDayTitle(selected) : "Kun tanlanmagan"}
          subtitle="Deadline'lar ro'yxati"
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
                className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.courseTitle}</p>
                </div>
                <Badge tone={item.type === "quiz" ? "blue" : "amber"}>
                  {item.type === "quiz" ? "Test" : "Topshiriq"}
                </Badge>
                <span className="text-xs font-medium text-slate-600">{timeText(item.dueAt)}</span>
                <span className="text-xs text-slate-400">{fmtDateTime(item.dueAt)}</span>
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
