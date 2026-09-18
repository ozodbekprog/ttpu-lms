"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
} from "@/components/ui";
import { cn, dayName } from "@/lib/utils";
import {
  SLOT_TIMES,
  matchCourseSlug,
  normalizeTeacherName,
} from "@/components/attendance/lesson-utils";
import type { CourseOption } from "@/components/attendance/lesson-utils";
import { NowLesson } from "./now-lesson";
import type { ScheduleEntryItem, ScheduleStatus } from "./types";
import {
  dayIsoInWeek,
  formatDayShort,
  formatWeekRange,
  isoWeekNumber,
  resolveWeekStart,
  shiftWeek,
  weekParityOf,
} from "./week-utils";

type GroupItem = { id: string; name: string };
type ViewMode = "grid" | "list";
type StaffMode = "group" | "teacher" | "room";
type ApiResponse = { ok: true; data: unknown } | { ok: false; error: string };

type FormState = {
  id: string | null;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string;
  room: string;
  parity: "" | "odd" | "even";
  status: ScheduleStatus;
  note: string;
};

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const PARITY_LABEL: Record<string, string> = {
  odd: "Toq hafta",
  even: "Juft hafta",
};

const STATUS_META: Record<ScheduleStatus, { label: string; tone: "amber" | "blue" | "rose" } | null> = {
  NORMAL: null,
  CHANGED: { label: "O'zgargan", tone: "amber" },
  MOVED: { label: "Ko'chirilgan", tone: "blue" },
  CANCELLED: { label: "Bekor qilindi", tone: "rose" },
};

const ATTENDANCE_CLASS = "border border-slate-200 text-brand-700! hover:border-brand-300! hover:bg-brand-50!";
const EDIT_CLASS = "text-brand-700! hover:bg-brand-50!";
const DELETE_CLASS = "text-slate-400! hover:bg-rose-50! hover:text-rose-600!";
const EXPORT_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50";

function toStatus(value: string): ScheduleStatus {
  return value === "CHANGED" || value === "MOVED" || value === "CANCELLED" ? value : "NORMAL";
}

export function ScheduleBoard({
  canEdit,
  groups,
  selectedGroupId,
  entries,
  today,
  isCurrentWeek,
  weekStart,
  todayIso,
  nowMinutes,
}: {
  canEdit: boolean;
  groups: GroupItem[];
  selectedGroupId: string | null;
  entries: ScheduleEntryItem[];
  today: number;
  isCurrentWeek: boolean;
  weekStart: string;
  todayIso: string;
  nowMinutes: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState<{ name: string; courses: CourseOption[] } | null>(null);
  const [mode, setMode] = useState<StaffMode>("group");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [roomQuery, setRoomQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    async function load() {
      try {
        const [meResponse, coursesResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/courses"),
        ]);
        const me = (await meResponse.json().catch(() => null)) as {
          ok?: boolean;
          user?: { role?: string; name?: string };
        } | null;
        if (!me?.ok || me.user?.role !== "TEACHER" || !me.user.name) return;
        const payload = (await coursesResponse.json().catch(() => null)) as {
          ok?: boolean;
          data?: Array<{ slug: string; title: string }>;
        } | null;
        if (!payload?.ok || !payload.data) return;
        if (!cancelled) {
          setTeacher({
            name: me.user.name,
            courses: payload.data.map((course) => ({ slug: course.slug, title: course.title })),
          });
        }
      } catch {
        if (!cancelled) setTeacher(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const selectedGroupName = selectedGroup?.name ?? null;

  const weekNumber = isoWeekNumber(weekStart);
  const parity = weekParityOf(weekStart);
  const parityLabel = parity === "even" ? "Juft hafta" : "Toq hafta";

  const teacherOptions = (() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      if (!entry.teacher) continue;
      const key = normalizeTeacherName(entry.teacher);
      if (!map.has(key)) map.set(key, entry.teacher);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  })();

  const parityEntries = entries.filter((entry) => entry.parity === null || entry.parity === parity);
  const teacherKey = teacherFilter ? normalizeTeacherName(teacherFilter) : null;
  const roomNeedle = roomQuery.trim().toLowerCase();

  const visibleEntries =
    !canEdit || mode === "group"
      ? parityEntries.filter((entry) => entry.groupId === selectedGroupId)
      : mode === "teacher"
        ? teacherKey
          ? parityEntries.filter(
              (entry) => entry.teacher !== null && normalizeTeacherName(entry.teacher) === teacherKey,
            )
          : []
        : roomNeedle
          ? parityEntries.filter((entry) => (entry.room ?? "").toLowerCase().includes(roomNeedle))
          : [];

  const exportQuery = `groupId=${encodeURIComponent(selectedGroupId ?? "")}&week=${weekStart}`;

  function attendanceHref(entry: ScheduleEntryItem): string | null {
    if (!teacher || !entry.teacher) return null;
    if (normalizeTeacherName(entry.teacher) !== normalizeTeacherName(teacher.name)) return null;
    const date = dayIsoInWeek(weekStart, entry.dayOfWeek);
    if (date > todayIso) return null;
    const slug = matchCourseSlug(entry.subject, teacher.courses) ?? teacher.courses[0]?.slug;
    if (!slug) return null;
    return `/courses/${slug}/attendance/lesson?date=${date}&slot=${entry.slot}`;
  }

  function goWeek(week: string) {
    const query = new URLSearchParams();
    if (selectedGroupId) query.set("groupId", selectedGroupId);
    query.set("week", week);
    router.push(`/schedule?${query.toString()}`);
  }

  function changeGroup(groupId: string) {
    if (!canEdit) return;
    const query = new URLSearchParams();
    if (groupId) query.set("groupId", groupId);
    if (weekStart) query.set("week", weekStart);
    router.push(`/schedule?${query.toString()}`);
  }

  function changeMode(next: StaffMode) {
    setMode(next);
    if (next === "teacher" && !teacherFilter && teacherOptions[0]) {
      setTeacherFilter(teacherOptions[0]);
    }
  }

  function openAdd(day: number, slot: number) {
    setError(null);
    setForm({ id: null, dayOfWeek: day, slot, subject: "", teacher: "", room: "", parity: "", status: "NORMAL", note: "" });
  }

  function openEdit(entry: ScheduleEntryItem) {
    setError(null);
    setForm({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      slot: entry.slot,
      subject: entry.subject,
      teacher: entry.teacher ?? "",
      room: entry.room ?? "",
      parity: entry.parity === "odd" || entry.parity === "even" ? entry.parity : "",
      status: entry.status,
      note: entry.note ?? "",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const payload = {
      dayOfWeek: form.dayOfWeek,
      slot: form.slot,
      subject: form.subject.trim(),
      teacher: form.teacher.trim() || null,
      room: form.room.trim() || null,
      parity: form.parity || null,
      status: form.status,
      note: form.note.trim() || null,
    };
    try {
      const response = form.id
        ? await fetch(`/api/schedule/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, groupId: selectedGroupId }),
          });
      const json = (await response.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setForm(null);
      router.refresh();
    } catch {
      setError("Server bilan aloqa xatosi");
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: ScheduleEntryItem) {
    if (!window.confirm(`${entry.subject} darsini o'chirishni tasdiqlaysizmi?`)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/schedule/${entry.id}`, { method: "DELETE" });
      const json = (await response.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Server bilan aloqa xatosi");
    } finally {
      setSaving(false);
    }
  }

  function entriesAt(day: number, slot: number) {
    return visibleEntries.filter((entry) => entry.dayOfWeek === day && entry.slot === slot);
  }

  function entriesForDay(day: number) {
    return visibleEntries
      .filter((entry) => entry.dayOfWeek === day)
      .slice()
      .sort((a, b) => a.slot - b.slot);
  }

  if (groups.length === 0 || !selectedGroupId) {
    return (
      <EmptyState
        title="Guruh topilmadi"
        description="Jadvalni ko'rish uchun sizga guruh biriktirilgan bo'lishi kerak."
      />
    );
  }

  return (
    <div className="space-y-4">
      <NowLesson entries={visibleEntries} today={today} isCurrentWeek={isCurrentWeek} nowMinutes={nowMinutes} />

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => goWeek(shiftWeek(weekStart, -1))}>
                ← Oldingi
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goWeek(resolveWeekStart(null))}
                disabled={isCurrentWeek}
              >
                Bugun
              </Button>
              <Button variant="secondary" size="sm" onClick={() => goWeek(shiftWeek(weekStart, 1))}>
                Keyingi →
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{formatWeekRange(weekStart)}</p>
              <Badge tone={parity === "even" ? "blue" : "slate"}>
                {`${parityLabel} · #${weekNumber}`}
              </Badge>
              <Badge tone="slate">{visibleEntries.length} ta dars</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-52">
              <Label>Guruh</Label>
              <Select value={selectedGroupId ?? ""} onChange={(event) => changeGroup(event.target.value)} disabled={!canEdit}>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            </div>

            {canEdit ? (
              <div className="w-full sm:w-40">
                <Label>Rejim</Label>
                <Select
                  value={mode}
                  onChange={(event) =>
                    changeMode(
                      event.target.value === "teacher" || event.target.value === "room"
                        ? event.target.value
                        : "group",
                    )
                  }
                >
                  <option value="group">Guruh</option>
                  <option value="teacher">{"O'qituvchi"}</option>
                  <option value="room">Xona</option>
                </Select>
              </div>
            ) : null}

            {canEdit && mode === "teacher" ? (
              <div className="w-full sm:w-56">
                <Label>{"O'qituvchi"}</Label>
                <Select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
                  <option value="">Tanlang</option>
                  {teacherOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {canEdit && mode === "room" ? (
              <div className="w-full sm:w-56">
                <Label>Xona</Label>
                <Input
                  value={roomQuery}
                  onChange={(event) => setRoomQuery(event.target.value)}
                  placeholder="Masalan: 205"
                />
              </div>
            ) : null}

            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    view === "grid" ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  Jadval
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    view === "list" ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {"Ro'yxat"}
                </button>
              </div>
              <a className={EXPORT_CLASS} href={`/schedule/print?${exportQuery}`} target="_blank" rel="noreferrer">
                Chop etish
              </a>
              <a className={EXPORT_CLASS} href={`/api/schedule/export/ics?${exportQuery}`} target="_blank" rel="noreferrer">
                Kalendar (.ics)
              </a>
              {canEdit && mode === "group" ? (
                <Button onClick={() => openAdd(today, 1)}>{"Dars qo'shish"}</Button>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {form ? (
        <Card className="border-brand-200">
          <CardHeader
            title={form.id ? "Yozuvni tahrirlash" : "Yangi dars qo'shish"}
            subtitle={selectedGroupName ?? undefined}
          />
          <CardBody>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Kun</Label>
                <Select
                  value={form.dayOfWeek}
                  onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })}
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {dayName(day)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Par</Label>
                <Select
                  value={form.slot}
                  onChange={(event) => setForm({ ...form, slot: Number(event.target.value) })}
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}-par ({SLOT_TIMES[slot]})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Fan</Label>
                <Input
                  required
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  placeholder="MATH 1"
                />
              </div>
              <div>
                <Label>{"O'qituvchi"}</Label>
                <Input
                  value={form.teacher}
                  onChange={(event) => setForm({ ...form, teacher: event.target.value })}
                  placeholder="A.MAMANAZAROV"
                />
              </div>
              <div>
                <Label>Xona</Label>
                <Input
                  value={form.room}
                  onChange={(event) => setForm({ ...form, room: event.target.value })}
                  placeholder="205-xona"
                />
              </div>
              <div>
                <Label>Hafta turi (ixtiyoriy)</Label>
                <Select
                  value={form.parity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({ ...form, parity: value === "odd" || value === "even" ? value : "" });
                  }}
                >
                  <option value="">Har hafta</option>
                  <option value="odd">Toq hafta</option>
                  <option value="even">Juft hafta</option>
                </Select>
              </div>
              <div>
                <Label>Holat</Label>
                <Select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: toStatus(event.target.value) })}
                >
                  <option value="NORMAL">{"O'zgarishsiz"}</option>
                  <option value="CHANGED">{"O'zgargan"}</option>
                  <option value="MOVED">{"Ko'chirilgan"}</option>
                  <option value="CANCELLED">Bekor qilindi</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Izoh (ixtiyoriy)</Label>
                <Input
                  value={form.note}
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                  placeholder="Masalan: xona o'zgardi"
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={saving}>
                  {form.id ? "Saqlash" : "Qo'shish"}
                </Button>
                <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
                  Bekor qilish
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card className={cn(view === "list" && "hidden")}>
        <CardHeader title="Haftalik jadval" subtitle={selectedGroupName ?? undefined} />
        <CardBody>
          <Table className="[&>table]:min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-28 px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Vaqt
                </th>
                {DAYS.map((day) => {
                  const isToday = isCurrentWeek && day === today;
                  return (
                    <th
                      key={day}
                      className={cn(
                        "relative px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wide",
                        isToday ? "bg-brand-50 text-brand-800" : "text-slate-400",
                      )}
                    >
                      {isToday ? <span className="absolute inset-x-0 top-0 h-0.5 bg-gold-400" /> : null}
                      {`${dayName(day)} ${formatDayShort(dayIsoInWeek(weekStart, day))}`}
                      {isToday ? (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold normal-case text-brand-700">
                          bugun
                        </span>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="border-b border-slate-100 align-top last:border-0">
                  <td className="w-28 border-r border-slate-100 px-3 py-3.5">
                    <p className="text-sm font-medium text-slate-700">{slot}-par</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{SLOT_TIMES[slot]}</p>
                  </td>
                  {DAYS.map((day) => {
                    const cellEntries = entriesAt(day, slot);
                    const isToday = isCurrentWeek && day === today;
                    return (
                      <td key={day} className={cn("px-2 py-2.5", isToday && "bg-brand-50/60")}>
                        <div className="space-y-2">
                          {cellEntries.map((entry) => {
                            const href = attendanceHref(entry);
                            const meta = STATUS_META[entry.status];
                            const cancelled = entry.status === "CANCELLED";
                            return (
                              <div
                                key={entry.id}
                                title={entry.note ?? undefined}
                                className={cn(
                                  "group rounded-xl border bg-white px-3 py-2.5 transition-all duration-150",
                                  cancelled
                                    ? "border-rose-200/70 opacity-60"
                                    : "border-slate-200/70 hover:border-brand-200 hover:shadow-card",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-sm font-semibold leading-snug text-slate-900",
                                    cancelled && "text-slate-500 line-through",
                                  )}
                                >
                                  {entry.subject}
                                </p>
                                {entry.teacher ? (
                                  <p className="mt-0.5 text-xs text-slate-500">{entry.teacher}</p>
                                ) : null}
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  {mode !== "group" ? <Badge tone="purple">{entry.groupName}</Badge> : null}
                                  {entry.room ? <Badge tone="slate">{entry.room}</Badge> : null}
                                  {entry.parity ? (
                                    <Badge tone="amber">{PARITY_LABEL[entry.parity] ?? entry.parity}</Badge>
                                  ) : null}
                                  {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
                                </div>
                                {entry.note ? (
                                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{entry.note}</p>
                                ) : null}
                                {href ? (
                                  <div className="mt-2 flex">
                                    <ButtonLink size="sm" variant="ghost" href={href} className={ATTENDANCE_CLASS}>
                                      Davomat
                                    </ButtonLink>
                                  </div>
                                ) : null}
                                {canEdit ? (
                                  <div className="mt-2 flex gap-1 transition-opacity duration-150 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={EDIT_CLASS}
                                      onClick={() => openEdit(entry)}
                                      disabled={saving}
                                    >
                                      Tahrir
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={DELETE_CLASS}
                                      onClick={() => remove(entry)}
                                      disabled={saving}
                                    >
                                      {"O'chirish"}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                          {canEdit && mode === "group" && cellEntries.length === 0 ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full border border-dashed border-slate-200 py-2 text-slate-400! hover:border-brand-300! hover:bg-brand-50/50! hover:text-brand-700!"
                              onClick={() => openAdd(day, slot)}
                              disabled={saving}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                              {"Qo'shish"}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      <Card className={cn(view === "grid" && "hidden")}>
        <CardHeader title="Kunlik agenda" subtitle={selectedGroupName ?? undefined} />
        <CardBody className="space-y-4">
          {DAYS.map((day) => {
            const dayEntries = entriesForDay(day);
            const isToday = isCurrentWeek && day === today;
            return (
              <div key={day} className="overflow-hidden rounded-2xl border border-slate-200/70">
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 border-b px-4 py-2.5",
                    isToday ? "border-brand-100 bg-brand-50" : "border-slate-100 bg-slate-50/70",
                  )}
                >
                  <p className={cn("text-sm font-semibold", isToday ? "text-brand-800" : "text-slate-700")}>
                    {`${dayName(day)} ${formatDayShort(dayIsoInWeek(weekStart, day))}`}
                  </p>
                  {isToday ? (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      bugun
                    </span>
                  ) : null}
                </div>
                {dayEntries.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">{"Darslar yo'q"}</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {dayEntries.map((entry) => {
                      const href = attendanceHref(entry);
                      const meta = STATUS_META[entry.status];
                      const cancelled = entry.status === "CANCELLED";
                      return (
                        <div
                          key={entry.id}
                          title={entry.note ?? undefined}
                          className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3", cancelled && "opacity-60")}
                        >
                          <span className="w-24 shrink-0 text-xs font-medium text-slate-500">
                            {SLOT_TIMES[entry.slot]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm font-semibold text-slate-900",
                                cancelled && "text-slate-500 line-through",
                              )}
                            >
                              {entry.subject}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {[entry.room, entry.teacher].filter(Boolean).join(" · ") || "—"}
                            </p>
                            {entry.note ? (
                              <p className="mt-0.5 text-[11px] text-slate-400">{entry.note}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {mode !== "group" ? <Badge tone="purple">{entry.groupName}</Badge> : null}
                            {entry.parity ? (
                              <Badge tone="slate">{PARITY_LABEL[entry.parity] ?? entry.parity}</Badge>
                            ) : null}
                            {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
                            {href ? (
                              <ButtonLink size="sm" variant="ghost" href={href} className={ATTENDANCE_CLASS}>
                                Davomat
                              </ButtonLink>
                            ) : null}
                            {canEdit ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={EDIT_CLASS}
                                  onClick={() => openEdit(entry)}
                                  disabled={saving}
                                >
                                  Tahrir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={DELETE_CLASS}
                                  onClick={() => remove(entry)}
                                  disabled={saving}
                                >
                                  {"O'chirish"}
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
