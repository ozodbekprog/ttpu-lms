"use client";

import { useCallback, useMemo, useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Label, Select } from "@/components/ui";
import { normalizeTeacherName } from "@/components/attendance/lesson-utils";
import { formatWeekRange, shiftWeek } from "@/components/schedule/week-utils";
import type { ScheduleStatus } from "@/components/schedule/types";
import { BlockPanel } from "./block-panel";
import { BuilderGrid } from "./grid";
import { BuilderPalette } from "./palette";
import { BuilderStats } from "./stats";
import { BuilderToast } from "./toast";
import type {
  BuilderCourse,
  BuilderEntry,
  BuilderGroup,
  CellRef,
  DragPayload,
  Selection,
  ToastMessage,
} from "./types";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function apiRequest<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, init);
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (!payload) return { ok: false, error: "Server bilan aloqa xatosi" };
    if (!payload.ok && response.status === 409) return { ok: false, error: "Bu vaqt band" };
    return payload;
  } catch {
    return { ok: false, error: "Server bilan aloqa xatosi" };
  }
}

function isDragPayload(value: unknown): value is DragPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { kind?: unknown; id?: unknown; subject?: unknown };
  if (record.kind === "move") return typeof record.id === "string" && typeof record.subject === "string";
  if (record.kind === "new") return typeof record.subject === "string";
  return false;
}

export function ScheduleBuilder({
  role,
  userName,
  groups,
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
  userName: string;
  groups: BuilderGroup[];
  selectedGroupId: string;
  weekStart: string;
  weekParity: "odd" | "even";
  weekNumber: number;
  entries: BuilderEntry[];
  courses: BuilderCourse[];
  teacherOptions: string[];
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

  const dismissToast = useCallback(() => setToast(null), []);

  const visibleEntries = useMemo(
    () => entries.filter((entry) => entry.parity === null || entry.parity === weekParity),
    [entries, weekParity],
  );

  const teacher = role === "TEACHER" ? userName : teacherInput.trim();

  function canManageEntry(entry: BuilderEntry) {
    if (role === "ADMIN") return true;
    if (!entry.teacher) return false;
    return normalizeTeacherName(entry.teacher) === normalizeTeacherName(userName);
  }

  function showToast(tone: ToastMessage["tone"], text: string) {
    setToast({ id: Date.now(), tone, text });
  }

  function flashSnap(id: string) {
    setSnapId(id);
    window.setTimeout(() => setSnapId((current) => (current === id ? null : current)), 180);
  }

  async function createEntry(cell: CellRef, subject: string) {
    setPending(true);
    const result = await apiRequest<BuilderEntry>("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: selectedGroupId,
        dayOfWeek: cell.day,
        slot: cell.slot,
        subject,
        teacher: teacher || null,
        room: room || null,
        parity: parity || null,
        status: "NORMAL",
      }),
    });
    setPending(false);
    if (!result.ok) {
      showToast("error", result.error);
      return;
    }
    setEntries((prev) => [...prev, result.data]);
    flashSnap(result.data.id);
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
    setEntries((prev) => prev.map((entry) => (entry.id === id ? result.data : entry)));
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
    setEntries((prev) => prev.map((entry) => (entry.id === id ? result.data : entry)));
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
    setEntries((prev) => prev.map((entry) => (entry.id === id ? result.data : entry)));
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
    void createEntry(cell, parsed.subject);
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
    void createEntry(cell, selection.subject);
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
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
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
            courses={courses}
            selectedSubject={selectedSubject}
            onSelectSubject={(subject) =>
              setSelection((prev) =>
                prev && prev.kind === "new" && prev.subject === subject ? null : { kind: "new", subject },
              )
            }
            onDragStart={handleDragStart}
            onDragEnd={() => setHover(null)}
            rooms={roomOptions}
            room={room}
            onRoom={setRoom}
            role={role}
            fixedTeacher={userName}
            teacherValue={teacherInput}
            onTeacher={setTeacherInput}
            teacherOptions={teacherOptions}
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
