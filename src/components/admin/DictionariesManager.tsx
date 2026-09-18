"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Table } from "@/components/ui";
import { cn } from "@/lib/utils";

export type DictionarySubject = {
  id: string;
  name: string;
  code: string | null;
  color: string;
  teachers: Array<{ id: string; name: string }>;
};

export type TeacherUser = {
  id: string;
  name: string;
  email: string;
};

export type DictionaryTimeSlot = {
  id: string;
  slot: number;
  startTime: string;
  endTime: string;
};

export type DictionaryLessonType = {
  id: string;
  name: string;
  color: string;
};

type SectionKey = "subjects" | "timeSlots" | "lessonTypes";
type Mode = "create" | "edit" | null;
type ApiResult = { ok: boolean; error?: string };

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const FALLBACK_COLOR = "#3f5a9d";
const SUBJECT_COLOR = "#3f5a9d";
const LESSON_TYPE_COLOR = "#5373b8";

const COLOR_PRESETS = [
  "#1d3460",
  "#3f5a9d",
  "#5373b8",
  "#0ea5e9",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
] as const;

const TABS: Array<{ key: SectionKey; label: string; icon: ReactNode }> = [
  {
    key: "subjects",
    label: "Fanlar",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    key: "timeSlots",
    label: "Dars vaqtlari",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    key: "lessonTypes",
    label: "Dars turlari",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <path d="M7 7h.01" />
      </svg>
    ),
  },
];

const SECTION_META: Record<SectionKey, { title: string; subtitle: string; create: string; edit: string }> = {
  subjects: {
    title: "Fanlar",
    subtitle: "O'quv fanlari ro'yxati",
    create: "Yangi fan",
    edit: "Fanni tahrirlash",
  },
  timeSlots: {
    title: "Dars vaqtlari",
    subtitle: "Kunlik dars slotlari",
    create: "Yangi vaqt",
    edit: "Vaqtni tahrirlash",
  },
  lessonTypes: {
    title: "Dars turlari",
    subtitle: "Mashg'ulot turlari va ranglari",
    create: "Yangi tur",
    edit: "Turni tahrirlash",
  },
};

const GRADIENTS: Record<SectionKey, string> = {
  subjects: "from-brand-900 via-brand-500 to-gold-400",
  timeSlots: "from-sky-400 via-brand-500 to-brand-900",
  lessonTypes: "from-violet-400 via-purple-500 to-brand-700",
};

const TAB_ACTIVE: Record<SectionKey, string> = {
  subjects: "from-brand-800 to-brand-950 shadow-brand-900/25",
  timeSlots: "from-sky-500 to-brand-800 shadow-sky-500/25",
  lessonTypes: "from-violet-500 to-brand-800 shadow-violet-500/25",
};

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function ColorDot({ color, size = "size-4" }: { color: string; size?: string }) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full shadow-[0_0_0_1px_rgba(15,23,42,0.08)] ring-2 ring-white",
        size,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const valid = HEX_RE.test(value);
  const current = valid ? value : FALLBACK_COLOR;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-white p-1 shadow-sm transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
          <input
            type="color"
            value={current}
            onChange={(event) => onChange(event.target.value)}
            aria-label="Rang"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span className="size-full rounded-lg" style={{ backgroundColor: current }} />
        </span>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#3f5a9d"
          maxLength={7}
          className={cn("font-mono text-xs uppercase tracking-wide", !valid && value ? "border-rose-300" : undefined)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={`Rang ${preset}`}
            className={cn(
              "size-6 rounded-lg shadow-[0_0_0_1px_rgba(15,23,42,0.1)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              value.toLowerCase() === preset ? "ring-2 ring-brand-600 ring-offset-1" : undefined,
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>
      {!valid && value ? (
        <p className="inline-flex items-center gap-1 text-xs text-rose-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          #RRGGBB formatida kiriting
        </p>
      ) : null}
    </div>
  );
}

export default function DictionariesManager({
  subjects,
  timeSlots,
  lessonTypes,
}: {
  subjects: DictionarySubject[];
  timeSlots: DictionaryTimeSlot[];
  lessonTypes: DictionaryLessonType[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<SectionKey>("subjects");
  const [mode, setMode] = useState<Mode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", color: SUBJECT_COLOR });
  const [slotForm, setSlotForm] = useState({ slot: "", startTime: "09:00", endTime: "10:20" });
  const [typeForm, setTypeForm] = useState({ name: "", color: LESSON_TYPE_COLOR });
  const [teacherSubject, setTeacherSubject] = useState<DictionarySubject | null>(null);
  const [teacherList, setTeacherList] = useState<TeacherUser[] | null>(null);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const meta = SECTION_META[tab];
  const activeTab = TABS.find((item) => item.key === tab);
  const counts: Record<SectionKey, number> = {
    subjects: subjects.length,
    timeSlots: timeSlots.length,
    lessonTypes: lessonTypes.length,
  };

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!teacherSubject) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTeacherSubject(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [teacherSubject]);

  function switchTab(key: SectionKey) {
    setTab(key);
    setMode(null);
    setEditId(null);
    setError(null);
  }

  function resetForms() {
    setSubjectForm({ name: "", code: "", color: SUBJECT_COLOR });
    setSlotForm({ slot: "", startTime: "09:00", endTime: "10:20" });
    setTypeForm({ name: "", color: LESSON_TYPE_COLOR });
  }

  function openCreate() {
    resetForms();
    setMode("create");
    setEditId(null);
    setError(null);
    setNotice(null);
  }

  function openEditSubject(item: DictionarySubject) {
    setSubjectForm({ name: item.name, code: item.code ?? "", color: item.color });
    setMode("edit");
    setEditId(item.id);
    setError(null);
    setNotice(null);
  }

  function openEditSlot(item: DictionaryTimeSlot) {
    setSlotForm({ slot: String(item.slot), startTime: item.startTime, endTime: item.endTime });
    setMode("edit");
    setEditId(item.id);
    setError(null);
    setNotice(null);
  }

  function openEditType(item: DictionaryLessonType) {
    setTypeForm({ name: item.name, color: item.color });
    setMode("edit");
    setEditId(item.id);
    setError(null);
    setNotice(null);
  }

  function closeForm() {
    setMode(null);
    setEditId(null);
    setError(null);
  }

  async function send(url: string, method: "POST" | "PATCH" | "PUT" | "DELETE", body?: unknown) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json?.error ?? "Amalni bajarib bo'lmadi");
        return false;
      }
      return true;
    } catch {
      setError("Tarmoqda xatolik");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (tab === "subjects") {
      const payload = {
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim() ? subjectForm.code.trim() : null,
        color: subjectForm.color,
      };
      const ok =
        mode === "create"
          ? await send("/api/admin/subjects", "POST", payload)
          : await send(`/api/admin/subjects/${editId}`, "PATCH", payload);
      if (!ok) return;
      setNotice(mode === "create" ? "Fan qo'shildi" : "Fan yangilandi");
    } else if (tab === "timeSlots") {
      const payload = {
        slot: Number(slotForm.slot),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
      };
      const ok =
        mode === "create"
          ? await send("/api/admin/time-slots", "POST", payload)
          : await send(`/api/admin/time-slots/${editId}`, "PATCH", payload);
      if (!ok) return;
      setNotice(mode === "create" ? "Dars vaqti qo'shildi" : "Dars vaqti yangilandi");
    } else {
      const payload = { name: typeForm.name.trim(), color: typeForm.color };
      const ok =
        mode === "create"
          ? await send("/api/admin/lesson-types", "POST", payload)
          : await send(`/api/admin/lesson-types/${editId}`, "PATCH", payload);
      if (!ok) return;
      setNotice(mode === "create" ? "Dars turi qo'shildi" : "Dars turi yangilandi");
    }
    closeForm();
    router.refresh();
  }

  async function remove(url: string, question: string, message: string) {
    if (!window.confirm(question)) return;
    const ok = await send(url, "DELETE");
    if (!ok) return;
    setNotice(message);
    router.refresh();
  }

  async function openTeachers(subject: DictionarySubject) {
    setTeacherSubject(subject);
    setTeacherIds(subject.teachers.map((item) => item.id));
    setTeacherList(null);
    setError(null);
    setNotice(null);
    setTeachersLoading(true);
    try {
      const res = await fetch("/api/admin/users?role=TEACHER");
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; data?: TeacherUser[]; error?: string }
        | null;
      if (!res.ok || !json || !json.ok || !json.data) {
        setError(json?.error ?? "O'qituvchilar ro'yxatini yuklab bo'lmadi");
        return;
      }
      setTeacherList([...json.data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setError("Tarmoqda xatolik");
    } finally {
      setTeachersLoading(false);
    }
  }

  function closeTeachers() {
    setTeacherSubject(null);
    setTeacherList(null);
    setTeacherIds([]);
  }

  function toggleTeacher(id: string) {
    setTeacherIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  async function saveTeachers() {
    if (!teacherSubject) return;
    const ok = await send(`/api/admin/subjects/${teacherSubject.id}/teachers`, "PUT", {
      teacherIds,
    });
    if (!ok) return;
    setNotice(`"${teacherSubject.name}" faniga o'qituvchilar saqlandi`);
    closeTeachers();
    router.refresh();
  }

  const subjectValid = subjectForm.name.trim().length >= 2 && HEX_RE.test(subjectForm.color);
  const slotNumber = Number(slotForm.slot);
  const slotValid =
    Number.isInteger(slotNumber) &&
    slotNumber >= 1 &&
    slotNumber <= 20 &&
    TIME_RE.test(slotForm.startTime) &&
    TIME_RE.test(slotForm.endTime);
  const typeValid = typeForm.name.trim().length >= 2 && HEX_RE.test(typeForm.color);

  return (
    <div className="space-y-4">
      <div className="animate-fade-up flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_30px_-22px_rgba(29,52,96,0.25)]">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => switchTab(item.key)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                active
                  ? `bg-gradient-to-b text-white shadow-md ${TAB_ACTIVE[item.key]}`
                  : "text-slate-600 hover:-translate-y-px hover:bg-slate-100 hover:text-brand-900",
              )}
            >
              <span className={cn("transition-transform duration-200", !active && "group-hover:scale-110")}>
                {item.icon}
              </span>
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {notice ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {notice}
          </span>
        ) : null}
        {error ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </span>
        ) : null}
      </div>

      {mode ? (
        <Card className="animate-fade-up relative overflow-hidden border-brand-200/70">
          <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", GRADIENTS[tab])} />
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    TAB_ACTIVE[tab],
                  )}
                >
                  {activeTab?.icon}
                </span>
                {mode === "create" ? meta.create : meta.edit}
              </span>
            }
            subtitle={meta.subtitle}
            action={
              <Button variant="ghost" size="sm" onClick={closeForm}>
                Yopish
              </Button>
            }
          />
          <CardBody>
            {tab === "subjects" ? (
              <form
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <div>
                  <Label>Nomi</Label>
                  <Input
                    value={subjectForm.name}
                    onChange={(event) => setSubjectForm((form) => ({ ...form, name: event.target.value }))}
                    placeholder="Masalan: Fizika"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label>Kod</Label>
                  <Input
                    value={subjectForm.code}
                    onChange={(event) => setSubjectForm((form) => ({ ...form, code: event.target.value }))}
                    placeholder="PHY 1"
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label>Rang</Label>
                  <ColorField
                    value={subjectForm.color}
                    onChange={(color) => setSubjectForm((form) => ({ ...form, color }))}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
                  <span className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2">
                    <ColorDot color={subjectValid ? subjectForm.color : FALLBACK_COLOR} />
                    <span className="truncate text-sm font-medium text-slate-700">
                      {subjectForm.name.trim() || "Fan nomi"}
                    </span>
                    {subjectForm.code.trim() ? (
                      <Badge tone="slate" className="font-mono">
                        {subjectForm.code.trim()}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" onClick={closeForm}>
                      Bekor qilish
                    </Button>
                    <Button type="submit" disabled={busy || !subjectValid}>
                      {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                    </Button>
                  </span>
                </div>
              </form>
            ) : null}

            {tab === "timeSlots" ? (
              <form
                className="grid gap-4 sm:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <div>
                  <Label>Slot raqami</Label>
                  <Input
                    type="number"
                    value={slotForm.slot}
                    onChange={(event) => setSlotForm((form) => ({ ...form, slot: event.target.value }))}
                    placeholder="1"
                    min={1}
                    max={20}
                    required
                  />
                </div>
                <div>
                  <Label>Boshlanish</Label>
                  <Input
                    type="time"
                    value={slotForm.startTime}
                    onChange={(event) => setSlotForm((form) => ({ ...form, startTime: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Tugash</Label>
                  <Input
                    type="time"
                    value={slotForm.endTime}
                    onChange={(event) => setSlotForm((form) => ({ ...form, endTime: event.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                  <span className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2">
                    <Badge tone="blue">{slotForm.slot || "—"}-slot</Badge>
                    <span className="text-sm font-medium tabular-nums text-slate-700">
                      {slotForm.startTime} — {slotForm.endTime}
                    </span>
                    {slotValid && minutes(slotForm.endTime) - minutes(slotForm.startTime) > 0 ? (
                      <span className="text-xs text-slate-400">
                        {minutes(slotForm.endTime) - minutes(slotForm.startTime)} daqiqa
                      </span>
                    ) : null}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" onClick={closeForm}>
                      Bekor qilish
                    </Button>
                    <Button type="submit" disabled={busy || !slotValid}>
                      {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                    </Button>
                  </span>
                </div>
              </form>
            ) : null}

            {tab === "lessonTypes" ? (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <div>
                  <Label>Nomi</Label>
                  <Input
                    value={typeForm.name}
                    onChange={(event) => setTypeForm((form) => ({ ...form, name: event.target.value }))}
                    placeholder="Masalan: Amaliy"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label>Rang</Label>
                  <ColorField
                    value={typeForm.color}
                    onChange={(color) => setTypeForm((form) => ({ ...form, color }))}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <span className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
                      style={{ backgroundColor: typeValid ? typeForm.color : FALLBACK_COLOR }}
                    >
                      {typeForm.name.trim() || "Dars turi"}
                    </span>
                    <span className="font-mono text-xs uppercase text-slate-400">
                      {typeValid ? typeForm.color : FALLBACK_COLOR}
                    </span>
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" onClick={closeForm}>
                      Bekor qilish
                    </Button>
                    <Button type="submit" disabled={busy || !typeValid}>
                      {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                    </Button>
                  </span>
                </div>
              </form>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card key={tab} className="animate-fade-in relative overflow-hidden">
        <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", GRADIENTS[tab])} />
        <CardHeader
          title={meta.title}
          subtitle={`${counts[tab]} ta yozuv`}
          action={
            <Button size="sm" onClick={openCreate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {meta.create}
            </Button>
          }
        />
        {counts[tab] === 0 ? (
          <CardBody>
            <EmptyState
              title={`${meta.title} hozircha bo'sh`}
              description={`Birinchi yozuvni qo'shing — "${meta.create}" tugmasi orqali.`}
              action={
                <Button size="sm" variant="secondary" onClick={openCreate}>
                  + {meta.create}
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tab === "subjects" ? (
                  <>
                    <th className="px-5 py-3 font-semibold">Fan</th>
                    <th className="px-5 py-3 font-semibold">Kod</th>
                    <th className="px-5 py-3 font-semibold">Rang</th>
                    <th className="px-5 py-3 font-semibold">O&apos;qituvchilar</th>
                  </>
                ) : null}
                {tab === "timeSlots" ? (
                  <>
                    <th className="px-5 py-3 font-semibold">Slot</th>
                    <th className="px-5 py-3 font-semibold">Vaqt</th>
                    <th className="px-5 py-3 font-semibold">Davomiyligi</th>
                  </>
                ) : null}
                {tab === "lessonTypes" ? (
                  <>
                    <th className="px-5 py-3 font-semibold">Turi</th>
                    <th className="px-5 py-3 font-semibold">Rang</th>
                    <th className="px-5 py-3 font-semibold">Ko&apos;rinishi</th>
                  </>
                ) : null}
                <th className="px-5 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {tab === "subjects"
                ? subjects.map((subject, index) => (
                    <tr
                      key={subject.id}
                      className="animate-fade-up border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-brand-50/40"
                      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ColorDot color={HEX_RE.test(subject.color) ? subject.color : FALLBACK_COLOR} />
                          <span className="font-medium text-slate-900">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {subject.code ? (
                          <Badge tone="slate" className="font-mono">
                            {subject.code}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 font-mono text-xs uppercase shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"
                          style={{
                            backgroundColor: `${HEX_RE.test(subject.color) ? subject.color : FALLBACK_COLOR}14`,
                            color: HEX_RE.test(subject.color) ? subject.color : FALLBACK_COLOR,
                          }}
                        >
                          <ColorDot color={HEX_RE.test(subject.color) ? subject.color : FALLBACK_COLOR} size="size-2.5" />
                          {subject.color}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {subject.teachers.length === 0 ? (
                          <span className="text-xs italic text-slate-400">Biriktirilmagan</span>
                        ) : (
                          <div className="flex max-w-72 flex-wrap items-center gap-1">
                            {subject.teachers.slice(0, 3).map((teacher) => (
                              <span
                                key={teacher.id}
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/80 px-2 py-0.5 text-xs font-medium text-brand-800"
                              >
                                <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-800/10 text-[9px] font-bold uppercase text-brand-800">
                                  {teacher.name.trim().charAt(0)}
                                </span>
                                {teacher.name}
                              </span>
                            ))}
                            {subject.teachers.length > 3 ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                +{subject.teachers.length - 3}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => openTeachers(subject)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            O&apos;qituvchilar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openEditSubject(subject)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                            </svg>
                            Tahrirlash
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() =>
                              remove(`/api/admin/subjects/${subject.id}`, `"${subject.name}" fani o'chirilsinmi?`, "Fan o'chirildi")
                            }
                          >
                            O&apos;chirish
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}

              {tab === "timeSlots"
                ? timeSlots.map((item, index) => {
                    const validRange = TIME_RE.test(item.startTime) && TIME_RE.test(item.endTime);
                    const duration = validRange ? minutes(item.endTime) - minutes(item.startTime) : null;
                    return (
                      <tr
                        key={item.id}
                        className="animate-fade-up border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-brand-50/40"
                        style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                      >
                        <td className="px-5 py-3">
                          <Badge tone="blue">{item.slot}-slot</Badge>
                        </td>
                        <td className="px-5 py-3 font-medium tabular-nums text-slate-900">
                          {item.startTime} — {item.endTime}
                        </td>
                        <td className="px-5 py-3">
                          {duration && duration > 0 ? (
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-900 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.round((duration / 180) * 100))}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-slate-500">{duration} daqiqa</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => openEditSlot(item)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                              </svg>
                              Tahrirlash
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() =>
                                remove(
                                  `/api/admin/time-slots/${item.id}`,
                                  `${item.slot}-slot o'chirilsinmi?`,
                                  "Dars vaqti o'chirildi",
                                )
                              }
                            >
                              O&apos;chirish
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}

              {tab === "lessonTypes"
                ? lessonTypes.map((item, index) => (
                    <tr
                      key={item.id}
                      className="animate-fade-up border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-brand-50/40"
                      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ColorDot color={HEX_RE.test(item.color) ? item.color : FALLBACK_COLOR} />
                          <span className="font-medium text-slate-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 font-mono text-xs uppercase shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"
                          style={{
                            backgroundColor: `${HEX_RE.test(item.color) ? item.color : FALLBACK_COLOR}14`,
                            color: HEX_RE.test(item.color) ? item.color : FALLBACK_COLOR,
                          }}
                        >
                          <ColorDot color={HEX_RE.test(item.color) ? item.color : FALLBACK_COLOR} size="size-2.5" />
                          {item.color}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
                          style={{ backgroundColor: HEX_RE.test(item.color) ? item.color : FALLBACK_COLOR }}
                        >
                          {item.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => openEditType(item)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                            </svg>
                            Tahrirlash
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() =>
                              remove(
                                `/api/admin/lesson-types/${item.id}`,
                                `"${item.name}" turi o'chirilsinmi?`,
                                "Dars turi o'chirildi",
                              )
                            }
                          >
                            O&apos;chirish
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </Table>
        )}
      </Card>

      {teacherSubject ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="O'qituvchilarni biriktirish"
        >
          <button
            type="button"
            aria-label="Panelni yopish"
            onClick={closeTeachers}
            className="animate-fade-in absolute inset-0 cursor-default bg-slate-900/45 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)]">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  O&apos;qituvchilarni biriktirish
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                  <ColorDot
                    color={HEX_RE.test(teacherSubject.color) ? teacherSubject.color : FALLBACK_COLOR}
                    size="size-3"
                  />
                  {teacherSubject.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTeachers}
                aria-label="Yopish"
                className="rounded-lg p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto px-3 py-3">
              {teachersLoading ? (
                <div className="space-y-2 px-1 py-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                      <span className="size-4 animate-pulse rounded bg-slate-100" />
                      <span className="h-3.5 flex-1 animate-pulse rounded bg-slate-100" style={{ animationDelay: `${item * 80}ms` }} />
                    </div>
                  ))}
                </div>
              ) : null}
              {!teachersLoading && teacherList && teacherList.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">O&apos;qituvchilar topilmadi</p>
              ) : null}
              {!teachersLoading && teacherList
                ? teacherList.map((teacher) => {
                    const checked = teacherIds.includes(teacher.id);
                    return (
                      <label
                        key={teacher.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
                          checked
                            ? "border-brand-200 bg-brand-50/70 shadow-[0_1px_2px_rgba(29,52,96,0.06)]"
                            : "border-transparent hover:bg-slate-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTeacher(teacher.id)}
                          className="size-4 shrink-0 rounded border-slate-300 accent-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">{teacher.name}</span>
                          <span className="block truncate text-xs text-slate-400">{teacher.email}</span>
                        </span>
                        {checked ? (
                          <svg
                            className="shrink-0 text-brand-600"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : null}
                      </label>
                    );
                  })
                : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-xs font-medium text-slate-500">
                <Badge tone={teacherIds.length > 0 ? "blue" : "slate"}>{teacherIds.length} ta tanlandi</Badge>
              </span>
              <span className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={closeTeachers}>
                  Bekor qilish
                </Button>
                <Button size="sm" onClick={saveTeachers} disabled={busy || teachersLoading}>
                  {busy ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
