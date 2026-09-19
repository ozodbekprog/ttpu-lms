"use client";

import { Fragment } from "react";
import type { DragEvent, MouseEvent } from "react";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { cn, dayName } from "@/lib/utils";
import { dayIsoInWeek, formatDayShort } from "@/components/schedule/week-utils";
import type { ScheduleStatus } from "@/components/schedule/types";
import { LegoSurface } from "./lego";
import type { BuilderEntry, CellRef, DragPayload, Selection } from "./types";

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_META: Record<ScheduleStatus, { label: string; tone: "amber" | "blue" | "rose" } | null> = {
  NORMAL: null,
  CHANGED: { label: "O'zgargan", tone: "amber" },
  MOVED: { label: "Ko'chirilgan", tone: "blue" },
  CANCELLED: { label: "Bekor", tone: "rose" },
};

function BlockBadge({
  tone,
  children,
}: {
  tone: "slate" | "amber" | "blue" | "rose" | "purple";
  children: string;
}) {
  return (
    <Badge tone={tone} className="px-1.5 py-0 text-[10px] leading-4">
      {children}
    </Badge>
  );
}

function BuilderBlock({
  entry,
  weekStart,
  selected,
  snapping,
  canManage,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  entry: BuilderEntry;
  weekStart: string;
  selected: boolean;
  snapping: boolean;
  canManage: boolean;
  onSelect: (event: MouseEvent<HTMLElement>, entry: BuilderEntry) => void;
  onDragStart: (event: DragEvent<HTMLElement>, payload: DragPayload) => void;
  onDragEnd: () => void;
}) {
  const meta = STATUS_META[entry.status];
  const cancelled = entry.status === "CANCELLED";
  const title = entry.subjectRef?.name ?? entry.subject;
  return (
    <div
      draggable={canManage}
      onDragStart={
        canManage
          ? (event) => onDragStart(event, { kind: "move", id: entry.id, subject: title })
          : undefined
      }
      onDragEnd={onDragEnd}
      onClick={(event) => onSelect(event, entry)}
      className={cn(
        "transition-transform duration-200",
        snapping ? "z-10" : "",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      title={`${title}${entry.note ? ` · ${entry.note}` : ""}`}
    >
      <LegoSurface
        seed={title}
        color={entry.subjectRef?.color}
        selected={selected}
        muted={cancelled}
        snapping={snapping}
        className="px-2.5 py-2"
      >
        <p className={cn("pr-8 text-[13px] font-semibold leading-snug", cancelled && "line-through")}>{title}</p>
        {entry.teacher ? <p className="mt-0.5 truncate text-[11px] opacity-70">{entry.teacher}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {entry.subGroup ? <BlockBadge tone="purple">{entry.subGroup}</BlockBadge> : null}
          {entry.lessonType ? <BlockBadge tone="blue">{entry.lessonType}</BlockBadge> : null}
          {entry.room ? <BlockBadge tone="slate">{entry.room}</BlockBadge> : null}
          {entry.parity ? <BlockBadge tone="amber">{entry.parity === "odd" ? "Toq" : "Juft"}</BlockBadge> : null}
          {meta ? <BlockBadge tone={meta.tone}>{meta.label}</BlockBadge> : null}
        </div>
        <p className="mt-1 text-[10px] opacity-50">
          {`${dayName(entry.dayOfWeek).slice(0, 3)} ${formatDayShort(dayIsoInWeek(weekStart, entry.dayOfWeek))}`}
        </p>
      </LegoSurface>
    </div>
  );
}

export function BuilderGrid({
  entries,
  weekStart,
  selection,
  selectedEntryId,
  snapId,
  hover,
  canManageEntry,
  onSelectEntry,
  onSelectCell,
  onDragStart,
  onDragEnd,
  onDragOverCell,
  onDragLeaveCell,
  onDropCell,
  pending,
}: {
  entries: BuilderEntry[];
  weekStart: string;
  selection: Selection | null;
  selectedEntryId: string | null;
  snapId: string | null;
  hover: CellRef | null;
  canManageEntry: (entry: BuilderEntry) => boolean;
  onSelectEntry: (event: MouseEvent<HTMLElement>, entry: BuilderEntry) => void;
  onSelectCell: (cell: CellRef) => void;
  onDragStart: (event: DragEvent<HTMLElement>, payload: DragPayload) => void;
  onDragEnd: () => void;
  onDragOverCell: (event: DragEvent<HTMLElement>, cell: CellRef) => void;
  onDragLeaveCell: (event: DragEvent<HTMLElement>) => void;
  onDropCell: (event: DragEvent<HTMLElement>, cell: CellRef) => void;
  pending: boolean;
}) {
  const hasSelection = selection !== null;

  return (
    <Card>
      <CardHeader
        title="Haftalik konstruktor"
        subtitle="6 kun × 8 par — bo'sh kataklarga tashlang yoki bosing"
        action={pending ? <span className="text-xs font-medium text-slate-400">Saqlanmoqda…</span> : undefined}
      />
      <CardBody className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[88px_repeat(6,minmax(140px,1fr))] gap-2">
            <div />
            {DAYS.map((day) => (
              <div key={day} className="rounded-xl bg-brand-50/70 px-2 py-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{dayName(day)}</p>
                <p className="text-[11px] text-brand-500">{formatDayShort(dayIsoInWeek(weekStart, day))}</p>
              </div>
            ))}

            {SLOTS.map((slot) => (
              <Fragment key={slot}>
                <div className="flex flex-col items-end justify-center rounded-xl bg-slate-50 px-2 py-2 text-right">
                  <p className="text-xs font-semibold text-slate-700">{slot}-par</p>
                  <p className="text-[10px] text-slate-400">{SLOT_TIMES[slot]}</p>
                </div>
                {DAYS.map((day) => {
                  const cell = { day, slot };
                  const cellEntries = entries.filter((entry) => entry.dayOfWeek === day && entry.slot === slot);
                  const isHover = hover?.day === day && hover?.slot === slot;
                  return (
                    <div
                      key={day}
                      onDragOver={(event) => onDragOverCell(event, cell)}
                      onDragLeave={onDragLeaveCell}
                      onDrop={(event) => onDropCell(event, cell)}
                      onClick={() => onSelectCell(cell)}
                      className={cn(
                        "group min-h-24 rounded-2xl border p-1.5 transition-all duration-150",
                        isHover
                          ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                          : "border-slate-200/80 bg-slate-50/40",
                        hasSelection && !isHover
                          ? "cursor-pointer border-dashed border-brand-200 bg-brand-50/30 hover:border-brand-400 hover:bg-brand-50/70"
                          : "",
                      )}
                    >
                      <div className="space-y-1.5">
                        {cellEntries.map((entry) => (
                          <BuilderBlock
                            key={entry.id}
                            entry={entry}
                            weekStart={weekStart}
                            selected={selectedEntryId === entry.id}
                            snapping={snapId === entry.id}
                            canManage={canManageEntry(entry)}
                            onSelect={onSelectEntry}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                          />
                        ))}
                        {cellEntries.length === 0 ? (
                          <div
                            className={cn(
                              "flex min-h-20 items-center justify-center rounded-xl border border-dashed text-[11px] font-medium transition-all duration-150",
                              hasSelection
                                ? "border-brand-300 bg-brand-50/50 text-brand-500"
                                : "border-slate-200/80 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:border-brand-300 group-hover:bg-brand-50/50 group-hover:text-brand-400",
                            )}
                          >
                            {hasSelection ? "Qo'yish" : "+"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
