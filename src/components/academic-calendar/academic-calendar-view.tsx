"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";
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

const TYPE_META: Record<AcademicEventType, { label: string; tone: Tones; bar: string }> = {
  SEMESTER: { label: "Semestr", tone: "brand", bar: "bg-brand-500" },
  HOLIDAY: { label: "Ta'til", tone: "green", bar: "bg-emerald-500" },
  EXAM: { label: "Imtihon", tone: "amber", bar: "bg-amber-500" },
  EVENT: { label: "Tadbir", tone: "purple", bar: "bg-purple-500" },
};

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
    return (
      <div
        key={item.id}
        className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-shadow duration-150 hover:shadow-lift"
      >
        <span className={cn("mt-0.5 h-10 w-1 shrink-0 rounded-full", meta.bar)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{rangeText(item)}</p>
          {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
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
    );
  }

  function renderGroups(groups: MonthGroup[]) {
    return groups.map((group) => (
      <div key={group.key} className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
        <div className="space-y-2">{group.events.map(renderEvent)}</div>
      </div>
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canManage ? <Button onClick={openCreate}>+ Tadbir qo&apos;shish</Button> : <span />}
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_OPTIONS.map((option) => (
            <Badge key={option} tone={TYPE_META[option].tone}>
              {TYPE_META[option].label}
            </Badge>
          ))}
        </div>
      </div>

      {notice ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {notice}
        </span>
      ) : null}
      {actionError ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
          {actionError}
        </span>
      ) : null}

      {mode ? (
        <Card className="border-brand-200/70">
          <CardHeader
            title={mode === "create" ? "Yangi tadbir" : "Tadbirni tahrirlash"}
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
              <div>
                <Label>Turi</Label>
                <Select value={type} onChange={(event) => setType(event.target.value as AcademicEventType)}>
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {TYPE_META[option].label}
                    </option>
                  ))}
                </Select>
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
                <Label>Izoh</Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Tadbir haqida qisqacha ma'lumot"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy || title.trim().length < 2}>
                  {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                </Button>
                {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <Card>
        <CardHeader
          title="Kelayotgan tadbirlar"
          subtitle={loading ? "Yuklanmoqda..." : `${upcoming.length} ta`}
        />
        <CardBody className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Yuklanmoqda...</p>
          ) : upcomingGroups.length === 0 ? (
            <EmptyState
              title="Kelayotgan tadbirlar yo'q"
              description={canManage ? "Birinchi tadbirni qo'shing." : "Hozircha rejalashtirilgan tadbir yo'q."}
            />
          ) : (
            renderGroups(upcomingGroups)
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="O'tgan tadbirlar"
          subtitle={loading ? "Yuklanmoqda..." : `${past.length} ta`}
        />
        <CardBody className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Yuklanmoqda...</p>
          ) : pastGroups.length === 0 ? (
            <EmptyState title="O'tgan tadbirlar yo'q" />
          ) : (
            renderGroups(pastGroups)
          )}
        </CardBody>
      </Card>
    </div>
  );
}
