"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Label, Select } from "@/components/ui";
import { normalizeTeacherName } from "@/components/attendance/lesson-utils";
import { formatWeekRange, shiftWeek } from "@/components/schedule/week-utils";
import type { ScheduleStatus } from "@/components/schedule/types";
import { BlockPanel } from "./block-panel";
import { fallbackLessonTypes, fallbackSubjects, findCourseForSubject, parseDictionaries } from "./dictionaries";
import { BuilderGrid } from "./grid";
import { BuilderPalette } from "./palette";
import { BuilderStats } from "./stats";
import { BuilderToast } from "./toast";
import type {
  BuilderCourse,
  BuilderEntry,
  BuilderGroup,
  BuilderLessonType,
  BuilderSubject,
  BuilderTeacherRef,
  CellRef,
  DragPayload,
  Selection,
  ToastMessage,
} from "./types";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

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

function isDragPayload(value: unknown): value is DragPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { kind?: unknown; id?: unknown; subject?: unknown; subjectId?: unknown };
  if (record.kind === "move") return typeof record.id === "string" && typeof record.subject === "string";
  if (record.kind === "new") {
    if (typeof record.subject !== "string") return false;
    return record.subjectId === undefined || record.subjectId === null || typeof record.subjectId === "string";
  }
  return false;
}

function mergeEntry(current: BuilderEntry, incoming: BuilderEntry): BuilderEntry {
  return { ...current, ...incoming, subjectRef: incoming.subjectRef ?? current.subjectRef };
}

export function ScheduleBuilder({
  role,
  userId,
  userName,
  groups,
  myGroupIds,
  mySubjects,
  selectedGroupId,
  weekStart,
  weekParity,
  weekNumber,
  entries: initialEntries,
  courses,
  teacherOptions,
  roomOptions,
}: {
  role: "TEACHER" | "ADMIN";
  userId: string;
  userName: string;
  groups: BuilderGroup[];
  myGroupIds: string[];
  mySubjects: BuilderSubject[];
  selectedGroupId: string;
  weekStart: string;
  weekParity: "odd" | "even";
  weekNumber: number;
  entries: BuilderEntry[];
  courses: BuilderCourse[];
  teacherOptions: BuilderTeacherRef[];
  roomOptions: string[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hover, setHover] = useState<CellRef | null>(null);
  const [snapId, setSnapId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [pending, setPending] = useState(false);
  const [room, setRoom] = useState("");
  const [parity, setParity] = useState<"" | "odd" | "even">(weekParity);
  const [teacherInput, setTeacherInput] = useState("");
  const [subjects, setSubjects] = useState<BuilderSubject[] | null>(null);
  const [lessonTypes, setLessonTypes] = useState<BuilderLessonType[] | null>(null);
  const [lessonType, setLessonType] = useState("Ma'ruza");
  const autoTeacherRef = useRef<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let cancelled = false;
    async function loadDictionaries() {
      const response = await fetch("/api/dictionaries").catch(() => null);
      if (!response || !response.ok) return;
      const payload: unknown = await response.json().catch(() => null);
      if (cancelled) return;
      const parsed = parseDictionaries(payload);
      if (!parsed) return;
      if (parsed.subjects.length > 0) setSubjects(parsed.subjects);
      if (parsed.lessonTypes.length > 0) {
        setLessonTypes(parsed.lessonTypes);
        setLessonType((current) =>
          parsed.lessonTypes.some((item) => item.name === current) ? current : parsed.lessonTypes[0]?.name ?? current,
        );
      }
    }
    void loadDictionaries();
    return () => {
      cancelled = true;
    };
  }, []);

  const subjectOptions = useMemo(
    () =>
      role === "TEACHER" && mySubjects.length > 0
        ? mySubjects
        : subjects && subjects.length > 0
          ? subjects
          : fallbackSubjects(courses),
    [role, mySubjects, subjects, courses],
  );
  const lessonTypeOptions = useMemo(
    () => (lessonTypes && lessonTypes.length > 0 ? lessonTypes : fallbackLessonTypes()),
    [lessonTypes],
  );
  const myGroupIdSet = useMemo(() => new Set(myGroupIds), [myGroupIds]);
  const myGroups = useMemo(() => groups.filter((group) => myGroupIdSet.has(group.id)), [groups, myGroupIdSet]);
  const otherGroups = useMemo(() => groups.filter((group) => !myGroupIdSet.has(group.id)), [groups, myGroupIdSet]);

  const visibleEntries = useMemo(
    () => entries.filter((entry) => entry.parity === null || entry.parity === weekParity),
    [entries, weekParity],
  );

  const teacher = role === "TEACHER" ? userName : teacherInput.trim();

  function canManageEntry(entry: BuilderEntry) {
    if (role === "ADMIN") return true;
    if (entry.teacherId) return entry.teacherId === userId;
    if (!entry.teacher) return false;
    return normalizeTeacherName(entry.teacher) === normalizeTeacherName(userName);
  }

  function showToast(tone: ToastMessage["tone"], text: string) {
    setToast({ id: Date.now(), tone, text });
  }

  function flashSnap(id: string) {
    setSnapId(id);
    window.setTimeout(() => setSnapId((current) => (current === id ? null : current)), 220);
  }

  function groupOption(group: BuilderGroup) {
    return (
      <option key={group.id} value={group.id}>
        {group.name}
      </option>
    );
  }

  function selectSubject(subject: BuilderSubject) {
    setSelection((prev) =>
      prev && prev.kind === "new" && prev.subject === subject.name
        ? null
        : { kind: "new", subject: subject.name, subjectId: subject.id },
    );
    const linked = findCourseForSubject(subject, courses);
    if (role === "ADMIN" && linked?.teacherName && (teacherInput.trim() === "" || teacherInput === autoTeacherRef.current)) {
      autoTeacherRef.current = linked.teacherName;
      setTeacherInput(linked.teacherName);
    }
  }

  function resolveTeacherId(name: string) {
    const normalized = normalizeTeacherName(name);
    if (!normalized) return null;
    return (
      teacherOptions.find((option) => option.id && normalizeTeacherName(option.name) === normalized)?.id ?? null
    );
  }

  async function createEntry(cell: CellRef, subject: string, subjectId: string | null) {
    setPending(true);
    const teacherId = role === "TEACHER" ? userId : resolveTeacherId(teacher);
    const baseBody = {
      groupId: selectedGroupId,
      dayOfWeek: cell.day,
      slot: cell.slot,
      subject,
      teacher: teacher || null,
      teacherId,
      room: room || null,
      parity: parity || null,
      status: "NORMAL" as const,
    };
    const richBody = { ...baseBody, lessonType: lessonType || null, ...(subjectId ? { subjectId } : {}) };
    let result = await apiRequest<BuilderEntry>("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(richBody),
    });
    if (!result.ok && result.status === 400) {
      result = await apiRequest<BuilderEntry>("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseBody),
      });
    }
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    const created = result.data;
    const color =
      subjectOptions.find((item) => (subjectId ? item.id === subjectId : item.name === subject))?.color ?? null;
    setEntries((prev) => [
      ...prev,
      {
        ...created,
        subjectId: created.subjectId ?? subjectId,
        lessonType: created.lessonType ?? (lessonType || null),
        subjectRef: created.subjectRef ?? { name: subject, color },
      },
    ]);
    flashSnap(created.id);
    showToast("success", `${subject} qo'yildi`);
  }

  async function moveEntry(id: string, cell: CellRef) {
    const current = entries.find((entry) => entry.id === id);
    if (!current) return;
    if (current.dayOfWeek === cell.day && current.slot === cell.slot) return;
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
      setEntries((prev) => prev.map((entry) => (entry.id === id ? current : entry)));
      showToast("error", result.error);
      return;
    }
    setEntries((prev) => prev.map((entry) => (entry.id === id ? mergeEntry(entry, result.data) : entry)));
    showToast("success", "Dars ko'chirildi");
  }

  async function saveRoom(id: string, value: string) {
    setPending(true);
    const result = await apiRequest<BuilderEntry>(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: value || null }),
    });
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    setEntries((prev) => prev.map((entry) => (entry.id === id ? mergeEntry(entry, result.data) : entry)));
    showToast("success", "Xona yangilandi");
  }

  async function changeStatus(id: string, status: ScheduleStatus) {
    setPending(true);
    const result = await apiRequest<BuilderEntry>(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    setEntries((prev) => prev.map((entry) => (entry.id === id ? mergeEntry(entry, result.data) : entry)));
    showToast("success", "Holat yangilandi");
  }

  async function deleteEntry(entry: BuilderEntry) {
    if (!window.confirm(`${entry.subject} darsini o'chirishni tasdiqlaysizmi?`)) return;
    setPending(true);
    const result = await apiRequest<{ id: string }>(`/api/schedule/${entry.id}`, { method: "DELETE" });
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    setEntries((prev) => prev.filter((item) => item.id !== entry.id));
    setSelection(null);
    showToast("success", "Dars o'chirildi");
  }

  function handleDragStart(event: DragEvent<HTMLElement>, payload: DragPayload) {
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
    setSelection(null);
    setHover(null);
  }

  function handleDragOverCell(event: DragEvent<HTMLElement>, cell: CellRef) {
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
    if (!isDragPayload(parsed)) return;
    if (parsed.kind === "move") {
      void moveEntry(parsed.id, cell);
      return;
    }
    void createEntry(cell, parsed.subject, parsed.subjectId);
  }

  function handleSelectEntry(event: MouseEvent<HTMLElement>, entry: BuilderEntry) {
    event.stopPropagation();
    if (selection && selection.kind === "new") {
      handleSelectCell({ day: entry.dayOfWeek, slot: entry.slot });
      return;
    }
    setSelection((prev) =>
      prev && prev.kind === "move" && prev.id === entry.id ? null : { kind: "move", id: entry.id },
    );
  }

  function handleSelectCell(cell: CellRef) {
    if (!selection) return;
    if (selection.kind === "move") {
      void moveEntry(selection.id, cell);
      setSelection(null);
      return;
    }
    void createEntry(cell, selection.subject, selection.subjectId);
    setSelection(null);
  }

  function changeGroup(groupId: string) {
    router.push(`/schedule/builder?groupId=${encodeURIComponent(groupId)}&week=${weekStart}`);
  }

  function goWeek(week: string) {
    router.push(`/schedule/builder?groupId=${encodeURIComponent(selectedGroupId)}&week=${week}`);
  }

  const selectedEntry =
    selection?.kind === "move" ? entries.find((entry) => entry.id === selection.id) ?? null : null;
  const selectedSubject = selection?.kind === "new" ? selection.subject : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-52">
            <Label>Guruh</Label>
            <Select value={selectedGroupId} onChange={(event) => changeGroup(event.target.value)}>
              {role === "TEACHER" && myGroups.length > 0 ? (
                <>
                  <optgroup label="Mening guruhlarim">{myGroups.map(groupOption)}</optgroup>
                  {otherGroups.length > 0 ? (
                    <optgroup label="Boshqa guruhlar">{otherGroups.map(groupOption)}</optgroup>
                  ) : null}
                </>
              ) : (
                groups.map(groupOption)
              )}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => goWeek(shiftWeek(weekStart, -1))}>
              ←
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">{formatWeekRange(weekStart)}</p>
              <p className="text-[11px] text-slate-500">{`#${weekNumber} hafta`}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => goWeek(shiftWeek(weekStart, 1))}>
              →
            </Button>
          </div>

          <Badge tone={weekParity === "even" ? "blue" : "slate"}>
            {weekParity === "even" ? "Juft hafta" : "Toq hafta"}
          </Badge>

          <p className="hidden text-xs text-slate-400 sm:ml-auto lg:block">
            Kompyuterda sudrab tashlang; telefonda blokni bosib, katakni bosing
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <BuilderPalette
            subjects={subjectOptions}
            courses={courses}
            selectedSubject={selectedSubject}
            onSelectSubject={selectSubject}
            onDragStart={handleDragStart}
            onDragEnd={() => setHover(null)}
            lessonTypes={lessonTypeOptions}
            lessonType={lessonType}
            onLessonType={setLessonType}
            rooms={roomOptions}
            room={room}
            onRoom={setRoom}
            role={role}
            fixedTeacher={userName}
            teacherValue={teacherInput}
            onTeacher={setTeacherInput}
            teacherOptions={teacherOptions.map((option) => option.name)}
            parity={parity}
            onParity={setParity}
          />
          <BuilderStats entries={visibleEntries} weekParity={weekParity} />
        </div>

        <BuilderGrid
          entries={visibleEntries}
          weekStart={weekStart}
          selection={selection}
          selectedEntryId={selectedEntry?.id ?? null}
          snapId={snapId}
          hover={hover}
          canManageEntry={canManageEntry}
          onSelectEntry={handleSelectEntry}
          onSelectCell={handleSelectCell}
          onDragStart={handleDragStart}
          onDragEnd={() => setHover(null)}
          onDragOverCell={handleDragOverCell}
          onDragLeaveCell={handleDragLeaveCell}
          onDropCell={handleDropCell}
          pending={pending}
        />
      </div>

      {selectedEntry ? (
        <BlockPanel
          entry={selectedEntry}
          canManage={canManageEntry(selectedEntry)}
          pending={pending}
          onClose={() => setSelection(null)}
          onSaveRoom={(value) => void saveRoom(selectedEntry.id, value)}
          onChangeStatus={(status) => void changeStatus(selectedEntry.id, status)}
          onDelete={(entry) => void deleteEntry(entry)}
        />
      ) : null}

      <BuilderToast toast={toast} onClose={dismissToast} />
    </div>
  );
}
