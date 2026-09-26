"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Skeleton, Textarea } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

export type AcademicEventType = "SEMESTER" | "HOLIDAY" | "EXAM" | "EVENT";

export type AcademicEventItem = {
  id: string;
  title: string;
  type: AcademicEventType;
  startDate: string;
  endDate: string | null;
  description: string | null;
};

type Tones = "brand" | "green" | "amber" | "purple";

type ListResponse = { ok: true; data: { events: AcademicEventItem[] } } | { ok: false; error: string };

type RequestResult = { ok: true } | { ok: false; error: string };

type MonthGroup = { key: string; label: string; events: AcademicEventItem[] };

type TypeMeta = {
  label: string;
  tone: Tones;
  dot: string;
  iconWrap: string;
  chipActive: string;
};

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

const TYPE_OPTIONS: AcademicEventType[] = ["SEMESTER", "HOLIDAY", "EXAM", "EVENT"];

const TYPE_META: Record<AcademicEventType, TypeMeta> = {
  SEMESTER: {
    label: "Semestr",
    tone: "brand",
    dot: "bg-brand-500",
    iconWrap: "border-brand-200 bg-brand-50 text-brand-700",
    chipActive: "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/15",
  },
  HOLIDAY: {
    label: "Ta'til",
    tone: "green",
    dot: "bg-emerald-500",
    iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    chipActive: "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/15",
  },
  EXAM: {
    label: "Imtihon",
    tone: "amber",
    dot: "bg-amber-500",
    iconWrap: "border-amber-200 bg-amber-50 text-amber-700",
    chipActive: "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/15",
  },
  EVENT: {
    label: "Tadbir",
    tone: "purple",
    dot: "bg-purple-500",
    iconWrap: "border-purple-200 bg-purple-50 text-purple-700",
    chipActive: "border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/15",
  },
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function TypeIcon({ type, size = 18 }: { type: AcademicEventType; size?: number }) {
  if (type === "SEMESTER") {
    return (
      <svg width={size} height={size} {...ICON_PROPS}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    );
  }
  if (type === "HOLIDAY") {
    return (
      <svg width={size} height={size} {...ICON_PROPS}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (type === "EXAM") {
    return (
      <svg width={size} height={size} {...ICON_PROPS}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} {...ICON_PROPS}>
      <path d="M8 2v4M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function monthLabel(date: Date): string {
  const name = MONTHS[date.getMonth()];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

function eventEnd(item: AcademicEventItem): Date {
  return new Date(item.endDate ?? item.startDate);
}

function startOfDay(value: Date | string): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function rangeText(item: AcademicEventItem): string {
  if (!item.endDate) return fmtDate(item.startDate);
  const start = new Date(item.startDate);
  const end = new Date(item.endDate);
  if (start.getTime() === end.getTime()) return fmtDate(item.startDate);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${fmtDate(item.endDate)}`;
  }
  return `${fmtDate(item.startDate)} — ${fmtDate(item.endDate)}`;
}

function durationDays(item: AcademicEventItem): number {
  const start = startOfDay(item.startDate);
  const end = startOfDay(eventEnd(item));
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

function durationText(item: AcademicEventItem): string {
  const days = durationDays(item);
  if (days === 1) return "1 kun";
  if (days < 7) return `${days} kun`;
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  return rest === 0 ? `${weeks} hafta` : `${weeks} hafta ${rest} kun`;
}

function statusText(item: AcademicEventItem, today: Date): { label: string; tone: string } | null {
  const start = startOfDay(item.startDate);
  const end = startOfDay(eventEnd(item));
  if (start <= today && today <= end) {
    return { label: "Davom etmoqda", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (start > today) {
    const days = Math.round((start.getTime() - today.getTime()) / 86400000);
    if (days > 30) return null;
    if (days === 1) return { label: "Ertaga boshlanadi", tone: "border-brand-200 bg-brand-50 text-brand-700" };
    return { label: `${days} kundan keyin`, tone: "border-brand-200 bg-brand-50 text-brand-700" };
  }
  return null;
}

function groupByMonth(items: AcademicEventItem[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const item of items) {
    const date = new Date(item.startDate);
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.events.push(item);
    } else {
      groups.set(key, { key, label: monthLabel(date), events: [item] });
    }
  }
  return Array.from(groups.values());
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function previewDuration(start: string, end: string): number | null {
  if (!start) return null;
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = end ? new Date(`${end}T00:00:00.000Z`) : startDate;
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  return Math.max(1, days);
}

function CalendarEmpty({ staff, onCreate }: { staff: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-600 text-white shadow-lg shadow-brand-900/20">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4M16 2v4" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18" />
          <path d="M12 14v4M10 16h4" />
        </svg>
      </span>
      <div>
        <p className="font-semibold text-slate-800">Hozircha tadbirlar yo&apos;q</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {staff
            ? "O'quv yili tadbirlarini qo'shing — ular oy bo'limlari bo'ylab vaqt chizig'ida joylashadi."
            : "O'quv yili tadbirlari e'lon qilinganda shu yerda paydo bo'ladi."}
        </p>
      </div>
      {staff ? (
        <Button onClick={onCreate} className="mt-1">
          + Tadbir qo&apos;shish
        </Button>
      ) : null}
    </div>
  );
}

export function AcademicCalendarView({ canManage }: { canManage: boolean }) {
  const [events, setEvents] = useState<AcademicEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AcademicEventType>("SEMESTER");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/academic-calendar", { cache: "no-store" });
        const json = (await response.json().catch(() => null)) as ListResponse | null;
        if (!active) return;
        if (!json || !json.ok) {
          setEvents([]);
          setError(json && !json.ok ? json.error : "Ma'lumotlarni yuklab bo'lmadi");
          return;
        }
        setEvents(json.data.events);
      } catch {
        if (!active) return;
        setEvents([]);
        setError("Ma'lumotlarni yuklab bo'lmadi");
      } finally {
        if (active) setLoading(false);
      }
    };
    void Promise.resolve().then(load);
    return () => {
      active = false;
    };
  }, [version]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const { upcoming, past } = useMemo(() => {
    const next: AcademicEventItem[] = [];
    const done: AcademicEventItem[] = [];
    for (const item of events) {
      if (eventEnd(item) >= today) next.push(item);
      else done.push(item);
    }
    done.reverse();
    return { upcoming: next, past: done };
  }, [events, today]);

  const upcomingGroups = useMemo(() => groupByMonth(upcoming), [upcoming]);
  const pastGroups = useMemo(() => groupByMonth(past), [past]);

  const currentMonthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  const formDuration = previewDuration(startDate, endDate);

  async function request(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<RequestResult> {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await response.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!response.ok || !json || !json.ok) {
        return { ok: false, error: json?.error ?? "Amalni bajarib bo'lmadi" };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Tarmoqda xatolik" };
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setMode("create");
    setEditId(null);
    setTitle("");
    setType("SEMESTER");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setFormError(null);
    setActionError(null);
    setNotice(null);
  }

  function openEdit(item: AcademicEventItem) {
    setMode("edit");
    setEditId(item.id);
    setTitle(item.title);
    setType(item.type);
    setStartDate(toDateInput(item.startDate));
    setEndDate(toDateInput(item.endDate));
    setDescription(item.description ?? "");
    setFormError(null);
    setActionError(null);
    setNotice(null);
  }

  function closeForm() {
    setMode(null);
    setEditId(null);
    setFormError(null);
  }

  async function submit() {
    if (title.trim().length < 2) {
      setFormError("Nomi kamida 2 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!startDate) {
      setFormError("Boshlanish sanasini kiriting");
      return;
    }
    if (endDate && endDate < startDate) {
      setFormError("Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak");
      return;
    }
    const payload = {
      title: title.trim(),
      type,
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: endDate ? `${endDate}T00:00:00.000Z` : null,
      description: description.trim() ? description.trim() : null,
    };
    const result =
      mode === "create"
        ? await request("/api/academic-calendar", "POST", payload)
        : await request(`/api/academic-calendar/${editId}`, "PATCH", payload);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    const created = mode === "create";
    closeForm();
    setNotice(created ? "Tadbir qo'shildi" : "Tadbir yangilandi");
    setVersion((value) => value + 1);
  }

  async function remove(item: AcademicEventItem) {
    if (!window.confirm(`"${item.title}" tadbiri o'chirilsinmi?`)) return;
    const result = await request(`/api/academic-calendar/${item.id}`, "DELETE");
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setActionError(null);
    setNotice("Tadbir o'chirildi");
    setVersion((value) => value + 1);
  }

  function renderEvent(item: AcademicEventItem) {
    const meta = TYPE_META[item.type] ?? TYPE_META.EVENT;
    const isPast = eventEnd(item) < today;
    const status = isPast ? null : statusText(item, today);
    return (
      <article key={item.id} className="relative flex gap-3">
        <span
          className={cn(
            "relative z-[1] mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm",
            meta.iconWrap,
            isPast && "opacity-80",
          )}
        >
          <TypeIcon type={item.type} />
        </span>
        <div
          className={cn(
            "min-w-0 flex-1 rounded-2xl border border-slate-200/70 bg-white p-4 transition-all duration-150 hover:border-slate-300 hover:shadow-lift",
            isPast && "opacity-75 saturate-[0.85]",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {status ? (
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", status.tone)}>
                    {status.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-slate-500">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4M16 2v4" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                <span>{rangeText(item)}</span>
                <span className="text-slate-500">·</span>
                <span>{durationText(item)}</span>
              </p>
              {item.description ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p> : null}
            </div>
            {canManage ? (
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                  Tahrirlash
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => remove(item)}
                >
                  O&apos;chirish
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderSkeleton() {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 rounded-2xl border border-slate-100 p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderGroups(groups: MonthGroup[], pastSection: boolean) {
    return groups.map((group) => (
      <section key={group.key} className="space-y-2.5">
        <div className="sticky top-14 z-10 -mx-6 flex items-center gap-2 border-b border-slate-100 bg-white/95 px-6 py-2 backdrop-blur md:top-0">
          <span className={cn("size-1.5 shrink-0 rounded-full", pastSection ? "bg-slate-300" : "bg-brand-500")} />
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</h4>
          {group.key === currentMonthKey && !pastSection ? (
            <span className="rounded-full bg-gold-300/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-800">
              Bu oy
            </span>
          ) : null}
          <span className="ml-auto text-[11px] font-medium text-slate-600">{group.events.length} ta</span>
        </div>
        <div className="relative space-y-3">
          <span aria-hidden="true" className="absolute bottom-6 left-5 top-6 w-px bg-slate-200" />
          {group.events.map(renderEvent)}
        </div>
      </section>
    ));
  }

  function renderForm() {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-brand-950/40 p-4 backdrop-blur-sm sm:p-8"
        role="dialog"
        aria-modal="true"
        onClick={(event) => {
          if (event.target === event.currentTarget && !busy) closeForm();
        }}
      >
        <div className="mx-auto w-full max-w-2xl">
          <Card className="overflow-hidden border-brand-200/70 shadow-2xl shadow-brand-950/20">
            <CardHeader
              title={mode === "create" ? "Yangi tadbir" : "Tadbirni tahrirlash"}
              subtitle={mode === "create" ? "O'quv kalendariga yangi sana qo'shing" : "Tadbir ma'lumotlarini yangilang"}
              action={
                <Button variant="ghost" size="sm" onClick={closeForm}>
                  Yopish
                </Button>
              }
            />
            <CardBody>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <div className="sm:col-span-2">
                  <Label>Nomi</Label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="2026-27 o'quv yili boshlanishi"
                    required
                    minLength={2}
                    maxLength={200}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Turi</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TYPE_OPTIONS.map((option) => {
                      const meta = TYPE_META[option];
                      const active = option === type;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setType(option)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-150",
                            active
                              ? meta.chipActive
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-lg border", meta.iconWrap)}>
                            <TypeIcon type={option} size={15} />
                          </span>
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Boshlanish sanasi</Label>
                  <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
                </div>
                <div>
                  <Label>Tugash sanasi (ixtiyoriy)</Label>
                  <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  {startDate ? (
                    endDate && endDate < startDate ? (
                      <p className="text-xs font-medium text-rose-600">Tugash sanasi boshlanishdan keyin bo&apos;lishi kerak</p>
                    ) : (
                      <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        Davomiylik: {formDuration} kun
                      </p>
                    )
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <Label>Izoh</Label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Tadbir haqida qisqacha ma'lumot"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                {formError ? (
                  <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 sm:col-span-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    {formError}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <Button type="submit" disabled={busy || title.trim().length < 2}>
                    {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                  </Button>
                  <Button variant="ghost" onClick={closeForm}>
                    Bekor qilish
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode ? renderForm() : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {canManage ? <Button onClick={openCreate}>+ Tadbir qo&apos;shish</Button> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200/70 bg-white px-3.5 py-2 shadow-sm">
          {TYPE_OPTIONS.map((option) => (
            <span key={option} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className={cn("size-2 rounded-full", TYPE_META[option].dot)} />
              {TYPE_META[option].label}
            </span>
          ))}
        </div>
      </div>

      {notice ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {notice}
        </span>
      ) : null}
      {actionError ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
          {actionError}
        </span>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {!loading && !error && events.length === 0 ? (
        <CalendarEmpty staff={canManage} onCreate={openCreate} />
      ) : (
        <>
          <Card>
            <CardHeader
              title="Kelayotgan tadbirlar"
              subtitle={loading ? "Yuklanmoqda..." : `${upcoming.length} ta tadbir`}
            />
            <CardBody className="space-y-4">
              {loading ? (
                renderSkeleton()
              ) : upcomingGroups.length === 0 ? (
                <EmptyState
                  title="Kelayotgan tadbirlar yo'q"
                  description={
                    canManage
                      ? "Yangi tadbir qo'shsangiz, u shu yerda paydo bo'ladi."
                      : "Hozircha rejalashtirilgan tadbir yo'q."
                  }
                  action={
                    canManage ? (
                      <Button size="sm" variant="secondary" onClick={openCreate}>
                        + Tadbir qo&apos;shish
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                renderGroups(upcomingGroups, false)
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="O'tgan tadbirlar"
              subtitle={loading ? "Yuklanmoqda..." : `${past.length} ta tadbir`}
            />
            <CardBody className="space-y-4">
              {loading ? (
                renderSkeleton()
              ) : pastGroups.length === 0 ? (
                <EmptyState title="O'tgan tadbirlar yo'q" description="Tugagan tadbirlar shu yerda arxivlanadi." />
              ) : (
                renderGroups(pastGroups, true)
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
