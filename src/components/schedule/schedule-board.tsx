"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
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
import type { ScheduleStatus } from "./types";
import { BuilderToast } from "./builder/toast";
import { LegoSurface } from "./builder/lego";
import { LegoPalette, isLegoDragPayload } from "./builder/lego-palette";
import type {
  BoardEntry,
  BuilderEntry,
  CellRef,
  LegoDragPayload,
  PaletteBlock,
  ToastMessage,
} from "./builder/types";
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
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };
type IconProps = { className?: string };

type NewBlockData = {
  blockId: string;
  title: string;
  subjectId: string | null;
  lessonType: string | null;
  room: string | null;
  teacher: string | null;
  color: string | null;
};

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const PARITY_LABEL: Record<string, string> = {
  odd: "Toq hafta",
  even: "Juft hafta",
};

type StatusMeta = { label: string; tone: "amber" | "blue" | "rose"; stripe: string; dot: string };

const STATUS_META: Record<ScheduleStatus, StatusMeta | null> = {
  NORMAL: null,
  CHANGED: { label: "O'zgargan", tone: "amber", stripe: "bg-amber-400", dot: "bg-amber-500" },
  MOVED: { label: "Ko'chirilgan", tone: "blue", stripe: "bg-sky-400", dot: "bg-sky-500" },
  CANCELLED: { label: "Bekor qilindi", tone: "rose", stripe: "bg-rose-500", dot: "bg-rose-500" },
};

const SUBJECT_TONES = [
  { stripe: "bg-brand-500", wash: "bg-gradient-to-br from-brand-50 via-white to-white", chip: "bg-brand-100 text-brand-700" },
  { stripe: "bg-sky-400", wash: "bg-gradient-to-br from-sky-50 via-white to-white", chip: "bg-sky-100 text-sky-700" },
  { stripe: "bg-emerald-400", wash: "bg-gradient-to-br from-emerald-50 via-white to-white", chip: "bg-emerald-100 text-emerald-700" },
  { stripe: "bg-violet-400", wash: "bg-gradient-to-br from-violet-50 via-white to-white", chip: "bg-violet-100 text-violet-700" },
  { stripe: "bg-amber-400", wash: "bg-gradient-to-br from-amber-50 via-white to-white", chip: "bg-amber-100 text-amber-700" },
  { stripe: "bg-teal-400", wash: "bg-gradient-to-br from-teal-50 via-white to-white", chip: "bg-teal-100 text-teal-700" },
  { stripe: "bg-fuchsia-400", wash: "bg-gradient-to-br from-fuchsia-50 via-white to-white", chip: "bg-fuchsia-100 text-fuchsia-700" },
  { stripe: "bg-indigo-400", wash: "bg-gradient-to-br from-indigo-50 via-white to-white", chip: "bg-indigo-100 text-indigo-700" },
];

const BLOCK_SHADOW = "shadow-[0_1px_2px_rgba(16,24,40,0.05),0_10px_22px_-14px_rgba(29,52,96,0.32)]";

const ATTENDANCE_CLASS = "border border-slate-200 text-brand-700! hover:border-brand-300! hover:bg-brand-50!";
const DELETE_CLASS = "text-slate-400! hover:bg-rose-50! hover:text-rose-600!";
const EXPORT_CLASS =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900";
const FILTER_CLASS =
  "h-9 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 disabled:text-slate-400";
const FILTER_ICON_CLASS = "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400";
const CHEVRON_CLASS = "pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400";

function SvgIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </SvgIcon>
  );
}

function ChevronLeftIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m14 6-6 6 6 6" />
    </SvgIcon>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m10 6 6 6-6 6" />
    </SvgIcon>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m6 9 6 6 6-6" />
    </SvgIcon>
  );
}

function GridIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </SvgIcon>
  );
}

function ListIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.5" />
    </SvgIcon>
  );
}

function PrinterIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M6 9V3h12v6" />
      <rect x="4" y="9" width="16" height="8" rx="2" />
      <path d="M6 14h12v7H6z" />
    </SvgIcon>
  );
}

function CalendarSyncIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18M12 13v4M10 15h4" />
    </SvgIcon>
  );
}

function SlidersIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4 6h9M19 6h1M4 12h4M14 12h6M4 18h11M21 18h-1" />
      <circle cx="16" cy="6" r="2.2" />
      <circle cx="11" cy="12" r="2.2" />
      <circle cx="17" cy="18" r="2.2" />
    </SvgIcon>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 19v-1.5a4 4 0 0 0-3-3.85M16.5 4.2a3.2 3.2 0 0 1 0 6.1" />
    </SvgIcon>
  );
}

function TeacherIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </SvgIcon>
  );
}

function PinIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </SvgIcon>
  );
}

function CheckCircleIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </SvgIcon>
  );
}

function TrashIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </SvgIcon>
  );
}

function toneForSubject(subject: string) {
  let hash = 0;
  for (let index = 0; index < subject.length; index += 1) {
    hash = (hash * 31 + subject.charCodeAt(index)) % 1000003;
  }
  return SUBJECT_TONES[Math.abs(hash) % SUBJECT_TONES.length] ?? SUBJECT_TONES[0];
}

function clockMinutes(value: string): number | null {
  const [hours, minutes] = value.split(":");
  if (hours === undefined || minutes === undefined) return null;
  const h = Number(hours);
  const m = Number(minutes);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return h * 60 + m;
}

function slotAtMinutes(minutes: number): number | null {
  for (const slot of SLOTS) {
    const label = SLOT_TIMES[slot];
    if (!label) continue;
    const [from, to] = label.split("–");
    if (!from || !to) continue;
    const start = clockMinutes(from);
    const end = clockMinutes(to);
    if (start === null || end === null) continue;
    if (start <= minutes && minutes < end) return slot;
  }
  return null;
}

function cellBackground(isToday: boolean, isNowPair: boolean) {
  if (isToday && isNowPair) return "bg-gradient-to-b from-gold-300/25 to-gold-300/5";
  if (isToday) return "bg-gradient-to-b from-brand-50/90 to-brand-50/40";
  if (isNowPair) return "bg-gold-300/10";
  return "";
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, init);
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (!payload) return { ok: false, error: "Server bilan aloqa xatosi" };
    if (payload.ok) return payload;
    if (response.status === 409) return { ok: false, error: "Bu vaqt band", status: 409 };
    return { ok: false, error: payload.error, status: response.status };
  } catch {
    return { ok: false, error: "Server bilan aloqa xatosi" };
  }
}

function toBoardEntry(entry: BuilderEntry, groupName: string): BoardEntry {
  return {
    id: entry.id,
    groupId: entry.groupId,
    groupName,
    dayOfWeek: entry.dayOfWeek,
    slot: entry.slot,
    subject: entry.subject,
    subjectId: entry.subjectId,
    lessonType: entry.lessonType,
    subjectRef: entry.subjectRef,
    teacher: entry.teacher,
    teacherId: entry.teacherId,
    teacherRef: entry.teacherRef,
    room: entry.room,
    parity: entry.parity,
    status: entry.status,
    note: entry.note,
  };
}

function matchesBlock(entry: BoardEntry, block: PaletteBlock) {
  if (block.subjectId && entry.subjectId === block.subjectId) return true;
  return entry.subject.trim().toLowerCase() === block.title.trim().toLowerCase();
}

let tempSeq = 0;
let toastSeq = 0;

function nextTempId() {
  tempSeq += 1;
  return `temp-${tempSeq}`;
}

function nextToastId() {
  toastSeq += 1;
  return toastSeq;
}

export function ScheduleBoard({
  canEdit,
  role,
  userId,
  userName,
  groups,
  selectedGroupId,
  entries: initialEntries,
  today,
  isCurrentWeek,
  weekStart,
  todayIso,
  nowMinutes,
  palette,
  teacherOptions,
}: {
  canEdit: boolean;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  userId: string;
  userName: string;
  groups: GroupItem[];
  selectedGroupId: string | null;
  entries: BoardEntry[];
  today: number;
  isCurrentWeek: boolean;
  weekStart: string;
  todayIso: string;
  nowMinutes: number;
  palette: PaletteBlock[];
  teacherOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<BoardEntry[]>(initialEntries);
  const [mode, setMode] = useState<StaffMode>("group");
  const [view, setView] = useState<ViewMode>("grid");
  const [teacher, setTeacher] = useState<{ name: string; courses: CourseOption[] } | null>(null);
  const [teacherFilter, setTeacherFilter] = useState("");
  const [roomQuery, setRoomQuery] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [hover, setHover] = useState<CellRef | null>(null);
  const [snapId, setSnapId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [pending, setPending] = useState(false);
  const [adminTeacherId, setAdminTeacherId] = useState("");
  const actionRef = useRef<(() => void) | null>(null);
  const deletedRef = useRef<BoardEntry | null>(null);

  const isAdmin = role === "ADMIN";
  const groupMode = mode === "group";
  const canDrop = canEdit && groupMode && view === "grid";

  const dismissToast = useCallback(() => {
    actionRef.current = null;
    setToast(null);
  }, []);

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
  const nowPair = isCurrentWeek ? slotAtMinutes(nowMinutes) : null;

  const teacherOptionsFromEntries = (() => {
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

  const paletteBlocks = useMemo(() => {
    const scoped = entries.filter((entry) => entry.groupId === selectedGroupId);
    return palette.map((block) => ({
      ...block,
      placedCount: scoped.filter((entry) => matchesBlock(entry, block)).length,
    }));
  }, [entries, palette, selectedGroupId]);

  const selectedBlock = selectedBlockId
    ? paletteBlocks.find((block) => block.id === selectedBlockId) ?? null
    : null;
  const panelEntry = panelId ? entries.find((entry) => entry.id === panelId) ?? null : null;

  const exportQuery = `groupId=${encodeURIComponent(selectedGroupId ?? "")}&week=${weekStart}`;

  function canManageEntry(entry: BoardEntry) {
    if (isAdmin) return true;
    if (entry.teacherId) return entry.teacherId === userId;
    if (!entry.teacher) return false;
    return normalizeTeacherName(entry.teacher) === normalizeTeacherName(userName);
  }

  function teacherChoiceName(id: string, block: PaletteBlock) {
    return (
      teacherOptions.find((option) => option.id === id)?.name ??
      block.teacherChoices.find((option) => option.id === id)?.name ??
      null
    );
  }

  function teacherIdForBlock(block: PaletteBlock) {
    if (!isAdmin) return userId;
    return adminTeacherId || block.teacherId;
  }

  function teacherForBlock(block: PaletteBlock) {
    if (!isAdmin) return userName || block.teacherName;
    if (adminTeacherId) return teacherChoiceName(adminTeacherId, block) ?? block.teacherName;
    return block.teacherName;
  }

  function showToast(tone: ToastMessage["tone"], text: string, actionLabel?: string, action?: () => void) {
    actionRef.current = action ?? null;
    setToast({ id: nextToastId(), tone, text, actionLabel });
  }

  function flashSnap(id: string) {
    setSnapId(id);
    window.setTimeout(() => setSnapId((current) => (current === id ? null : current)), 240);
  }

  function attendanceHref(entry: BoardEntry): string | null {
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
    setSelectedBlockId(null);
    setPanelId(null);
    if (next === "teacher" && !teacherFilter && teacherOptionsFromEntries[0]) {
      setTeacherFilter(teacherOptionsFromEntries[0]);
    }
  }

  function changeView(next: ViewMode) {
    setView(next);
    setSelectedBlockId(null);
    setPanelId(null);
  }

  async function placeBlock(cell: CellRef, data: NewBlockData) {
    if (!selectedGroupId) return;
    setPanelId(null);
    const source = paletteBlocks.find((block) => block.id === data.blockId) ?? null;
    const teacher = source ? teacherForBlock(source) : data.teacher;
    const teacherId = source ? teacherIdForBlock(source) : null;
    const tempId = nextTempId();
    const optimistic: BoardEntry = {
      id: tempId,
      groupId: selectedGroupId,
      groupName: selectedGroupName ?? "",
      dayOfWeek: cell.day,
      slot: cell.slot,
      subject: data.title,
      subjectId: data.subjectId,
      lessonType: data.lessonType,
      subjectRef: { name: data.title, color: data.color },
      teacher,
      teacherId,
      teacherRef: null,
      room: data.room,
      parity: null,
      status: "NORMAL",
      note: null,
    };
    setEntries((prev) => [...prev, optimistic]);
    flashSnap(tempId);
    setPending(true);
    const result = await apiRequest<BuilderEntry>("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: selectedGroupId,
        dayOfWeek: cell.day,
        slot: cell.slot,
        subject: data.title,
        subjectId: data.subjectId,
        lessonType: data.lessonType,
        teacher,
        teacherId,
        room: data.room,
        parity: null,
        status: "NORMAL",
      }),
    });
    setPending(false);
    if (!result.ok) {
      setEntries((prev) => prev.filter((entry) => entry.id !== tempId));
      showToast("error", result.error);
      return;
    }
    const created = result.data;
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === tempId
          ? {
              ...toBoardEntry(created, selectedGroupName ?? ""),
              subjectRef: created.subjectRef ?? optimistic.subjectRef,
            }
          : entry,
      ),
    );
    flashSnap(created.id);
    showToast("success", "Qo'yildi ✓");
  }

  async function moveEntry(id: string, cell: CellRef) {
    const current = entries.find((entry) => entry.id === id);
    if (!current || current.id.startsWith("temp-")) return;
    if (current.dayOfWeek === cell.day && current.slot === cell.slot) return;
    setPanelId(null);
    const snapshot = current;
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, dayOfWeek: cell.day, slot: cell.slot } : entry)),
    );
    flashSnap(id);
    setPending(true);
    const result = await apiRequest<BuilderEntry>(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: cell.day, slot: cell.slot }),
    });
    setPending(false);
    if (!result.ok) {
      setEntries((prev) => prev.map((entry) => (entry.id === id ? snapshot : entry)));
      showToast("error", result.error);
      return;
    }
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...toBoardEntry(result.data, snapshot.groupName),
              subjectRef: result.data.subjectRef ?? snapshot.subjectRef,
            }
          : entry,
      ),
    );
    showToast("success", "Ko'chirildi ✓");
  }

  async function toggleCancel(entry: BoardEntry) {
    const next: ScheduleStatus = entry.status === "CANCELLED" ? "NORMAL" : "CANCELLED";
    const snapshot = entry.status;
    setEntries((prev) => prev.map((item) => (item.id === entry.id ? { ...item, status: next } : item)));
    setPending(true);
    const result = await apiRequest<BuilderEntry>(`/api/schedule/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    if (!result.ok) {
      setEntries((prev) => prev.map((item) => (item.id === entry.id ? { ...item, status: snapshot } : item)));
      showToast("error", result.error);
      return;
    }
    setEntries((prev) =>
      prev.map((item) =>
        item.id === entry.id
          ? {
              ...toBoardEntry(result.data, entry.groupName),
              subjectRef: result.data.subjectRef ?? entry.subjectRef,
            }
          : item,
      ),
    );
    showToast("success", next === "CANCELLED" ? "Bekor qilindi" : "Tiklandi");
  }

  async function undoDelete() {
    const entry = deletedRef.current;
    if (!entry) return;
    deletedRef.current = null;
    setPending(true);
    const result = await apiRequest<BuilderEntry>("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: entry.groupId,
        dayOfWeek: entry.dayOfWeek,
        slot: entry.slot,
        subject: entry.subject,
        subjectId: entry.subjectId,
        lessonType: entry.lessonType,
        teacher: entry.teacher,
        teacherId: entry.teacherId,
        room: entry.room,
        parity: entry.parity === "odd" || entry.parity === "even" ? entry.parity : null,
        status: entry.status,
        note: entry.note,
      }),
    });
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    const created = result.data;
    setEntries((prev) => [
      ...prev,
      { ...toBoardEntry(created, entry.groupName), subjectRef: created.subjectRef ?? entry.subjectRef },
    ]);
    showToast("success", "Qaytarildi ✓");
  }

  async function deleteEntry(entry: BoardEntry) {
    setPending(true);
    const result = await apiRequest<{ id: string }>(`/api/schedule/${entry.id}`, { method: "DELETE" });
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    setEntries((prev) => prev.filter((item) => item.id !== entry.id));
    setPanelId(null);
    setSelectedBlockId(null);
    deletedRef.current = entry;
    showToast("success", "O'chirildi", "Qaytarish", () => {
      void undoDelete();
    });
  }

  function handleDragStart(event: DragEvent<HTMLElement>, payload: LegoDragPayload) {
    const ghost = document.createElement("div");
    ghost.textContent = payload.subject;
    ghost.className =
      "rounded-xl border-2 border-brand-400 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-900 shadow-lg";
    ghost.style.position = "fixed";
    ghost.style.top = "-1000px";
    ghost.style.left = "-1000px";
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 16, 16);
    event.dataTransfer.effectAllowed = payload.kind === "new" ? "copy" : "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    window.setTimeout(() => ghost.remove(), 0);
    setHover(null);
    setPanelId(null);
  }

  function handlePaletteDragStart(event: DragEvent<HTMLElement>, block: PaletteBlock) {
    if (!canDrop) return;
    handleDragStart(event, {
      kind: "new",
      blockId: block.id,
      subject: block.title,
      subjectId: block.subjectId,
      lessonType: block.lessonType,
      room: block.room,
      teacher: teacherForBlock(block),
      color: block.color,
    });
  }

  function handleDragOverCell(event: DragEvent<HTMLElement>, cell: CellRef) {
    if (!canDrop) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (hover?.day !== cell.day || hover?.slot !== cell.slot) setHover(cell);
  }

  function handleDragLeaveCell(event: DragEvent<HTMLElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setHover(null);
  }

  function handleDropCell(event: DragEvent<HTMLElement>, cell: CellRef) {
    event.preventDefault();
    setHover(null);
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(event.dataTransfer.getData("application/json"));
    } catch {
      parsed = null;
    }
    if (!isLegoDragPayload(parsed)) return;
    if (parsed.kind === "move") {
      void moveEntry(parsed.id, cell);
      return;
    }
    void placeBlock(cell, {
      blockId: parsed.blockId,
      title: parsed.subject,
      subjectId: parsed.subjectId,
      lessonType: parsed.lessonType,
      room: parsed.room,
      teacher: parsed.teacher,
      color: parsed.color,
    });
  }

  function handleCellClick(cell: CellRef) {
    if (!canEdit) return;
    if (selectedBlock) {
      void placeBlock(cell, {
        blockId: selectedBlock.id,
        title: selectedBlock.title,
        subjectId: selectedBlock.subjectId,
        lessonType: selectedBlock.lessonType,
        room: selectedBlock.room,
        teacher: teacherForBlock(selectedBlock),
        color: selectedBlock.color,
      });
      return;
    }
    if (panelId) setPanelId(null);
  }

  function handleEntryClick(event: MouseEvent<HTMLElement>, entry: BoardEntry) {
    if (!canEdit || !canManageEntry(entry) || entry.id.startsWith("temp-")) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("a")) return;
    event.stopPropagation();
    setSelectedBlockId(null);
    setPanelId((current) => (current === entry.id ? null : entry.id));
  }

  function toggleBlock(block: PaletteBlock) {
    if (!canDrop) return;
    setPanelId(null);
    if (isAdmin && selectedBlockId !== block.id) setAdminTeacherId("");
    setSelectedBlockId((current) => (current === block.id ? null : block.id));
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

  const legend = (
    <div className="hidden items-center gap-3 text-[11px] text-slate-400 lg:flex">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-brand-500" />
        Dars
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-amber-500" />
        {"O'zgargan"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-sky-500" />
        {"Ko'chirilgan"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-rose-500" />
        Bekor
      </span>
    </div>
  );

  const gridSection = (
    <Card className={cn("animate-fade-in", view === "list" && "hidden")}>
      <CardHeader
        title="Haftalik jadval"
        subtitle={
          canEdit && view === "grid"
            ? "Blokni katakka sudrab tashlang yoki blokni bosib, katakni bosing"
            : selectedGroupName ?? undefined
        }
        action={pending ? <span className="text-xs font-medium text-slate-400">Saqlanmoqda…</span> : legend}
      />
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
            {SLOTS.map((slot) => {
              const isNowPair = nowPair === slot;
              return (
                <tr key={slot} className="border-b border-slate-100 align-top last:border-0">
                  <td
                    className={cn(
                      "w-28 border-r border-slate-100 px-3 py-3.5",
                      isNowPair && "bg-gold-300/10",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium", isNowPair ? "text-brand-800" : "text-slate-700")}>
                        {slot}-par
                      </p>
                      {isNowPair ? (
                        <span className="relative inline-flex size-1.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-500 opacity-60" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-gold-500" />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{SLOT_TIMES[slot]}</p>
                  </td>
                  {DAYS.map((day) => {
                    const cellEntries = entriesAt(day, slot);
                    const isToday = isCurrentWeek && day === today;
                    const isHover = hover?.day === day && hover?.slot === slot;
                    return (
                      <td
                        key={day}
                        onDragOver={canDrop ? (event) => handleDragOverCell(event, { day, slot }) : undefined}
                        onDragLeave={canDrop ? handleDragLeaveCell : undefined}
                        onDrop={canDrop ? (event) => handleDropCell(event, { day, slot }) : undefined}
                        onClick={canEdit ? () => handleCellClick({ day, slot }) : undefined}
                        className={cn(
                          "px-2 py-2.5 align-top transition-colors duration-150",
                          cellBackground(isToday, isNowPair && isToday),
                          canDrop && "cursor-pointer",
                          isHover && "bg-brand-50 ring-2 ring-inset ring-brand-200",
                          canDrop && selectedBlockId && !isHover && "bg-brand-50/40",
                        )}
                      >
                        <div className="space-y-2">
                          {cellEntries.map((entry) => {
                            const href = attendanceHref(entry);
                            const meta = STATUS_META[entry.status];
                            const cancelled = entry.status === "CANCELLED";
                            const tone = toneForSubject(entry.subject);
                            const stripe = meta?.stripe ?? tone.stripe;
                            const manageable = canEdit && canManageEntry(entry) && !entry.id.startsWith("temp-");
                            const inner = (
                              <>
                                <p
                                  className={cn(
                                    "text-sm font-semibold leading-snug",
                                    cancelled ? "text-slate-500 line-through" : "text-slate-900",
                                  )}
                                >
                                  {entry.subject}
                                </p>
                                {entry.teacher ? (
                                  <p className="mt-0.5 truncate text-xs text-slate-500">{entry.teacher}</p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  {mode !== "group" ? <Badge tone="purple">{entry.groupName}</Badge> : null}
                                  {entry.room ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
                                      <PinIcon className="size-3" />
                                      {entry.room}
                                    </span>
                                  ) : null}
                                  {entry.parity ? (
                                    <Badge tone="amber">{PARITY_LABEL[entry.parity] ?? entry.parity}</Badge>
                                  ) : null}
                                  {meta ? (
                                    <Badge tone={meta.tone} className="gap-1.5">
                                      <span className={cn("size-1.5 rounded-full", meta.dot)} />
                                      {meta.label}
                                    </Badge>
                                  ) : null}
                                </div>
                                {entry.note ? (
                                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{entry.note}</p>
                                ) : null}
                                {href ? (
                                  <div className="mt-2 flex">
                                    <ButtonLink size="sm" variant="ghost" href={href} className={ATTENDANCE_CLASS}>
                                      <CheckCircleIcon className="size-3.5" />
                                      Davomat
                                    </ButtonLink>
                                  </div>
                                ) : null}
                              </>
                            );
                            if (canEdit) {
                              return (
                                <div
                                  key={entry.id}
                                  draggable={canDrop && manageable}
                                  onDragStart={
                                    canDrop && manageable
                                      ? (event) =>
                                          handleDragStart(event, {
                                            kind: "move",
                                            id: entry.id,
                                            subject: entry.subject,
                                          })
                                      : undefined
                                  }
                                  onDragEnd={canDrop ? () => setHover(null) : undefined}
                                  onClick={manageable ? (event) => handleEntryClick(event, entry) : undefined}
                                  title={entry.note ?? undefined}
                                  className={cn(
                                    "transition-transform duration-200",
                                    manageable && canDrop
                                      ? "cursor-grab active:cursor-grabbing"
                                      : manageable
                                        ? "cursor-pointer"
                                        : "",
                                    snapId === entry.id && "z-10",
                                  )}
                                >
                                  <LegoSurface
                                    seed={entry.subject}
                                    color={entry.subjectRef?.color}
                                    selected={panelId === entry.id}
                                    muted={cancelled}
                                    snapping={snapId === entry.id}
                                    className="p-3 pl-4"
                                  >
                                    {inner}
                                  </LegoSurface>
                                </div>
                              );
                            }
                            return (
                              <div
                                key={entry.id}
                                title={entry.note ?? undefined}
                                className={cn(
                                  "group relative overflow-hidden rounded-xl border border-slate-200/70 p-3 pl-4 transition-all duration-200 ease-out",
                                  BLOCK_SHADOW,
                                  cancelled
                                    ? "opacity-70"
                                    : "hover:-translate-y-0.5 hover:border-transparent hover:shadow-lift",
                                )}
                              >
                                <span className={cn("pointer-events-none absolute inset-0", tone.wash)} />
                                <span className={cn("absolute inset-y-0 left-0 w-1.5", stripe)} />
                                <div className="relative">{inner}</div>
                              </div>
                            );
                          })}
                          {canDrop && cellEntries.length === 0 ? (
                            <div
                              className={cn(
                                "flex min-h-[72px] items-center justify-center rounded-xl border border-dashed text-lg font-semibold transition-all duration-150",
                                isHover || selectedBlockId
                                  ? "border-brand-300 bg-brand-50/70 text-brand-500"
                                  : "border-slate-200/80 text-slate-300 opacity-60",
                              )}
                            >
                              {isHover ? "+" : selectedBlockId ? "Qo'yish" : "+"}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </CardBody>
    </Card>
  );

  const listSection = (
    <Card className={cn("animate-fade-in", view === "grid" && "hidden")}>
      <CardHeader
        title="Kunlik agenda"
        subtitle={selectedGroupName ?? undefined}
        action={<Badge tone="slate">{`${visibleEntries.length} ta dars`}</Badge>}
      />
      <CardBody className="space-y-5">
        {DAYS.map((day) => {
          const dayEntries = entriesForDay(day);
          const isToday = isCurrentWeek && day === today;
          const dateIso = dayIsoInWeek(weekStart, day);
          return (
            <section
              key={day}
              className={cn(
                "overflow-hidden rounded-2xl border bg-white",
                isToday ? "border-brand-200/80 shadow-card" : "border-slate-200/70",
              )}
            >
              <header
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3",
                  isToday
                    ? "border-brand-100 bg-gradient-to-r from-brand-50 to-white"
                    : "border-slate-100 bg-slate-50/60",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                      isToday
                        ? "bg-brand-900 text-white shadow-sm"
                        : "bg-white text-slate-600 ring-1 ring-slate-200",
                    )}
                  >
                    {dateIso.slice(8, 10)}
                  </span>
                  <div>
                    <p className={cn("text-sm font-semibold", isToday ? "text-brand-900" : "text-slate-700")}>
                      {dayName(day)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {dayEntries.length > 0 ? `${dayEntries.length} ta dars` : "Darslar yo'q"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{formatDayShort(dateIso)}</span>
                  {isToday ? <Badge tone="blue">bugun</Badge> : null}
                </div>
              </header>
              {dayEntries.length === 0 ? (
                <p className="px-4 py-5 text-center text-xs text-slate-400">{"Bu kunda dars yo'q"}</p>
              ) : (
                <div className="px-4 py-4">
                  {dayEntries.map((entry, index) => {
                    const href = attendanceHref(entry);
                    const meta = STATUS_META[entry.status];
                    const cancelled = entry.status === "CANCELLED";
                    const tone = toneForSubject(entry.subject);
                    const stripe = meta?.stripe ?? tone.stripe;
                    const time = SLOT_TIMES[entry.slot] ?? "";
                    const [from, to] = time.split("–");
                    const manageable = canEdit && canManageEntry(entry) && !entry.id.startsWith("temp-");
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="w-14 shrink-0 pt-1 text-right">
                          <p className="text-xs font-semibold text-slate-600">{from ?? `${entry.slot}-par`}</p>
                          {to ? <p className="text-[10px] text-slate-400">{to}</p> : null}
                        </div>
                        <div
                          className={cn(
                            "relative flex-1 border-l border-slate-200 pl-4",
                            index === dayEntries.length - 1 ? "pb-0" : "pb-4",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute -left-[5.5px] top-2 size-2.5 rounded-full ring-4 ring-white",
                              stripe,
                            )}
                          />
                          <div
                            title={entry.note ?? undefined}
                            onClick={manageable ? (event) => handleEntryClick(event, entry) : undefined}
                            className={cn(
                              "relative overflow-hidden rounded-xl border p-3 pl-4 transition-all duration-200 ease-out",
                              BLOCK_SHADOW,
                              cancelled
                                ? "border-rose-200/70 opacity-70"
                                : "border-slate-200/70 hover:-translate-y-0.5 hover:shadow-lift",
                              manageable && "cursor-pointer",
                            )}
                          >
                            <span className={cn("pointer-events-none absolute inset-0", tone.wash)} />
                            <span className={cn("absolute inset-y-0 left-0 w-1", stripe)} />
                            <div className="relative flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "text-sm font-semibold leading-snug",
                                    cancelled ? "text-slate-500 line-through" : "text-slate-900",
                                  )}
                                >
                                  {entry.subject}
                                </p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                                  {entry.teacher ? <span>{entry.teacher}</span> : null}
                                  {entry.room ? (
                                    <span className="inline-flex items-center gap-1">
                                      <PinIcon className="size-3 text-slate-400" />
                                      {entry.room}
                                    </span>
                                  ) : null}
                                </p>
                                {entry.note ? (
                                  <p className="mt-1 text-[11px] text-slate-400">{entry.note}</p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  {mode !== "group" ? <Badge tone="purple">{entry.groupName}</Badge> : null}
                                  {entry.parity ? (
                                    <Badge tone="slate">{PARITY_LABEL[entry.parity] ?? entry.parity}</Badge>
                                  ) : null}
                                  {meta ? (
                                    <Badge tone={meta.tone} className="gap-1.5">
                                      <span className={cn("size-1.5 rounded-full", meta.dot)} />
                                      {meta.label}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                              {href ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <ButtonLink size="sm" variant="ghost" href={href} className={ATTENDANCE_CLASS}>
                                    <CheckCircleIcon className="size-3.5" />
                                    Davomat
                                  </ButtonLink>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-4">
      <NowLesson entries={visibleEntries} today={today} isCurrentWeek={isCurrentWeek} nowMinutes={nowMinutes} />

      <Card className="animate-fade-in">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-white shadow-sm">
                <CalendarIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-brand-950">
                  {formatWeekRange(weekStart)}
                </p>
                <p className="text-xs text-slate-400">{`${weekNumber}-hafta · ${visibleEntries.length} ta dars`}</p>
              </div>
              <Badge tone={parity === "even" ? "blue" : "gold"} className="hidden sm:inline-flex">
                {parityLabel}
              </Badge>
              {isCurrentWeek ? (
                <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 sm:inline-flex">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Joriy hafta
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" className="px-2!" onClick={() => goWeek(shiftWeek(weekStart, -1))}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goWeek(resolveWeekStart(null))}
                disabled={isCurrentWeek}
              >
                Bugun
              </Button>
              <Button variant="secondary" size="sm" className="px-2!" onClick={() => goWeek(shiftWeek(weekStart, 1))}>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
            <div className="relative w-full sm:w-44">
              <span className={FILTER_ICON_CLASS}>
                <UsersIcon className="size-3.5" />
              </span>
              <select
                aria-label="Guruh"
                value={selectedGroupId ?? ""}
                onChange={(event) => changeGroup(event.target.value)}
                disabled={!canEdit}
                className={FILTER_CLASS}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <span className={CHEVRON_CLASS}>
                <ChevronDownIcon className="size-3.5" />
              </span>
            </div>

            {canEdit ? (
              <div className="relative w-full sm:w-40">
                <span className={FILTER_ICON_CLASS}>
                  <SlidersIcon className="size-3.5" />
                </span>
                <select
                  aria-label="Rejim"
                  value={mode}
                  onChange={(event) =>
                    changeMode(
                      event.target.value === "teacher" || event.target.value === "room"
                        ? event.target.value
                        : "group",
                    )
                  }
                  className={FILTER_CLASS}
                >
                  <option value="group">Guruh</option>
                  <option value="teacher">{"O'qituvchi"}</option>
                  <option value="room">Xona</option>
                </select>
                <span className={CHEVRON_CLASS}>
                  <ChevronDownIcon className="size-3.5" />
                </span>
              </div>
            ) : null}

            {canEdit && mode === "teacher" ? (
              <div className="relative w-full sm:w-56">
                <span className={FILTER_ICON_CLASS}>
                  <TeacherIcon className="size-3.5" />
                </span>
                <select
                  aria-label="O'qituvchi"
                  value={teacherFilter}
                  onChange={(event) => setTeacherFilter(event.target.value)}
                  className={FILTER_CLASS}
                >
                  <option value="">Tanlang</option>
                  {teacherOptionsFromEntries.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <span className={CHEVRON_CLASS}>
                  <ChevronDownIcon className="size-3.5" />
                </span>
              </div>
            ) : null}

            {canEdit && mode === "room" ? (
              <div className="relative w-full sm:w-56">
                <span className={FILTER_ICON_CLASS}>
                  <PinIcon className="size-3.5" />
                </span>
                <input
                  aria-label="Xona"
                  value={roomQuery}
                  onChange={(event) => setRoomQuery(event.target.value)}
                  placeholder="Masalan: 205"
                  className={cn(FILTER_CLASS, "placeholder:font-normal placeholder:text-slate-400")}
                />
              </div>
            ) : null}

            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
              <div className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => changeView("grid")}
                  aria-pressed={view === "grid"}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150",
                    view === "grid" ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <GridIcon className="size-3.5" />
                  Jadval
                </button>
                <button
                  type="button"
                  onClick={() => changeView("list")}
                  aria-pressed={view === "list"}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150",
                    view === "list" ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <ListIcon className="size-3.5" />
                  {"Ro'yxat"}
                </button>
              </div>

              <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />

              <a className={EXPORT_CLASS} href={`/schedule/print?${exportQuery}`} target="_blank" rel="noreferrer">
                <PrinterIcon className="size-3.5" />
                Chop etish
              </a>
              <a className={EXPORT_CLASS} href={`/api/schedule/export/ics?${exportQuery}`} target="_blank" rel="noreferrer">
                <CalendarSyncIcon className="size-3.5" />
                Kalendar
              </a>
              {canEdit ? (
                <a className={EXPORT_CLASS} href={`/schedule/builder?${exportQuery}`}>
                  <SlidersIcon className="size-3.5" />
                  Konstruktor
                </a>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {canEdit && view === "grid" ? (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="self-start xl:sticky xl:top-4">
            <LegoPalette
              title={
                isAdmin
                  ? `Barcha fanlar — ${selectedGroupName ?? ""}`
                  : `Mening darslarim — ${selectedGroupName ?? ""}`
              }
              subtitle={`${paletteBlocks.length} ta fan · tayyor bloklar`}
              blocks={paletteBlocks}
              selectedBlockId={selectedBlockId}
              onSelect={toggleBlock}
              onDragStart={handlePaletteDragStart}
              onDragEnd={() => setHover(null)}
              isAdmin={isAdmin}
              teacherValue={adminTeacherId}
              onTeacherChange={setAdminTeacherId}
              teacherOptions={teacherOptions}
              resolveTeacher={teacherForBlock}
              disabled={!canDrop}
            />
          </div>
          <div className="min-w-0 space-y-4">
            {gridSection}
            {listSection}
          </div>
        </div>
      ) : (
        <>
          {gridSection}
          {listSection}
        </>
      )}

      {canEdit && panelEntry ? (
        <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-xs animate-fade-in">
          <Card className="border-brand-200 shadow-xl">
            <CardHeader
              title={panelEntry.subject}
              subtitle={`${dayName(panelEntry.dayOfWeek)}, ${panelEntry.slot}-par`}
              action={
                <Button variant="ghost" size="sm" onClick={() => setPanelId(null)}>
                  Yopish
                </Button>
              }
            />
            <CardBody className="space-y-2">
              {panelEntry.status === "CANCELLED" ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={pending}
                  onClick={() => void toggleCancel(panelEntry)}
                >
                  Tiklash
                </Button>
              ) : (
                <Button
                  variant="danger"
                  className="w-full"
                  disabled={pending}
                  onClick={() => void toggleCancel(panelEntry)}
                >
                  Bekor qilish
                </Button>
              )}
              <Button
                variant="ghost"
                className={cn("w-full", DELETE_CLASS)}
                disabled={pending}
                onClick={() => void deleteEntry(panelEntry)}
              >
                <TrashIcon className="size-3.5" />
                {"O'chirish"}
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <BuilderToast
        toast={toast}
        onClose={dismissToast}
        onAction={() => {
          const action = actionRef.current;
          actionRef.current = null;
          if (action) action();
        }}
      />
    </div>
  );
}
