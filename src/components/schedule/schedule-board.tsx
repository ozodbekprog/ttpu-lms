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
  isoForWeekday,
  matchCourseSlug,
  normalizeTeacherName,
} from "@/components/attendance/lesson-utils";
import type { CourseOption } from "@/components/attendance/lesson-utils";

export type ScheduleEntryItem = {
  id: string;
  groupId: string;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  parity: string | null;
};

type GroupItem = { id: string; name: string };

type ApiResponse = { ok: true; data: unknown } | { ok: false; error: string };

type FormState = {
  id: string | null;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string;
  room: string;
  parity: "" | "odd" | "even";
};

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const SLOT_TIMES: Record<number, string> = {
  1: "09:00–10:20",
  2: "10:30–11:50",
  3: "12:00–13:20",
  4: "14:20–15:40",
  5: "15:50–17:10",
  6: "17:20–18:40",
  7: "18:50–20:10",
  8: "20:20–21:40",
};

const PARITY_LABEL: Record<string, string> = {
  odd: "Toq hafta",
  even: "Juft hafta",
};

export function ScheduleBoard({
  canEdit,
  groups,
  selectedGroupId,
  entries,
  today,
}: {
  canEdit: boolean;
  groups: GroupItem[];
  selectedGroupId: string | null;
  entries: ScheduleEntryItem[];
  today: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState<{ name: string; courses: CourseOption[] } | null>(null);

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

  function attendanceHref(entry: ScheduleEntryItem): string | null {
    if (!teacher || !entry.teacher) return null;
    if (normalizeTeacherName(entry.teacher) !== normalizeTeacherName(teacher.name)) return null;
    if (entry.dayOfWeek > today) return null;
    const slug = matchCourseSlug(entry.subject, teacher.courses) ?? teacher.courses[0]?.slug;
    if (!slug) return null;
    return `/courses/${slug}/attendance/lesson?date=${isoForWeekday(entry.dayOfWeek, today)}&slot=${entry.slot}`;
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const selectedGroupName = selectedGroup?.name ?? null;

  function changeGroup(groupId: string) {
    if (!canEdit) return;
    router.push(groupId ? `/schedule?groupId=${encodeURIComponent(groupId)}` : "/schedule");
  }

  function openAdd(day: number, slot: number) {
    setError(null);
    setForm({ id: null, dayOfWeek: day, slot, subject: "", teacher: "", room: "", parity: "" });
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
    return entries.filter((entry) => entry.dayOfWeek === day && entry.slot === slot);
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
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Label>Guruh</Label>
            <Select
              value={selectedGroupId}
              onChange={(event) => changeGroup(event.target.value)}
              disabled={!canEdit}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </div>
          {canEdit ? (
            <Button onClick={() => openAdd(today, 1)}>{"Dars qo'shish"}</Button>
          ) : null}
          <Badge tone="slate" className="mb-2 self-end sm:ml-auto">
            {entries.length} ta yozuv
          </Badge>
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

      <Card>
        <CardHeader title="Haftalik jadval" subtitle={selectedGroupName ?? undefined} />
        <CardBody>
          <Table className="[&>table]:min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-28 px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Vaqt
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      "relative px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wide",
                      day === today ? "bg-brand-50 text-brand-800" : "text-slate-400",
                    )}
                  >
                    {day === today ? (
                      <span className="absolute inset-x-0 top-0 h-0.5 bg-gold-400" />
                    ) : null}
                    {dayName(day)}
                    {day === today ? (
                      <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold normal-case text-brand-700">
                        bugun
                      </span>
                    ) : null}
                  </th>
                ))}
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
                    return (
                      <td
                        key={day}
                        className={cn("px-2 py-2.5", day === today && "bg-brand-50/60")}
                      >
                        <div className="space-y-2">
                          {cellEntries.map((entry) => {
                            const href = attendanceHref(entry);
                            return (
                              <div
                                key={entry.id}
                                className="group rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 transition-all duration-150 hover:border-brand-200 hover:shadow-card"
                              >
                                <p className="text-sm font-semibold leading-snug text-slate-900">
                                  {entry.subject}
                                </p>
                                {entry.teacher ? (
                                  <p className="mt-0.5 text-xs text-slate-500">{entry.teacher}</p>
                                ) : null}
                                {entry.room || entry.parity ? (
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    {entry.room ? <Badge tone="slate">{entry.room}</Badge> : null}
                                    {entry.parity ? (
                                      <Badge tone="amber">
                                        {PARITY_LABEL[entry.parity] ?? entry.parity}
                                      </Badge>
                                    ) : null}
                                  </div>
                                ) : null}
                                {href ? (
                                  <div className="mt-2 flex">
                                    <ButtonLink
                                      size="sm"
                                      variant="ghost"
                                      href={href}
                                      className="border border-slate-200 text-brand-700! hover:border-brand-300! hover:bg-brand-50!"
                                    >
                                      Davomat
                                    </ButtonLink>
                                  </div>
                                ) : null}
                                {canEdit ? (
                                  <div className="mt-2 flex gap-1 transition-opacity duration-150 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-brand-700! hover:bg-brand-50!"
                                      onClick={() => openEdit(entry)}
                                      disabled={saving}
                                    >
                                      Tahrir
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-slate-400! hover:bg-rose-50! hover:text-rose-600!"
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
                          {canEdit && cellEntries.length === 0 ? (
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
    </div>
  );
}
