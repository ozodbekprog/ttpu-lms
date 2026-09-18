"use client";

import type { DragEvent } from "react";
import { Card, CardBody, CardHeader, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { LegoSurface } from "./lego";
import type { LegoDragPayload, PaletteBlock } from "./types";

export function isLegoDragPayload(value: unknown): value is LegoDragPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as {
    kind?: unknown;
    id?: unknown;
    subject?: unknown;
    subjectId?: unknown;
    blockId?: unknown;
  };
  if (record.kind === "move") return typeof record.id === "string" && typeof record.subject === "string";
  if (record.kind === "new") {
    if (typeof record.subject !== "string" || typeof record.blockId !== "string") return false;
    return record.subjectId === undefined || record.subjectId === null || typeof record.subjectId === "string";
  }
  return false;
}

export function LegoPalette({
  title,
  subtitle,
  blocks,
  selectedBlockId,
  onSelect,
  onDragStart,
  onDragEnd,
  isAdmin,
  teacherValue,
  onTeacherChange,
  teacherOptions,
  resolveTeacher,
  disabled,
}: {
  title: string;
  subtitle: string;
  blocks: PaletteBlock[];
  selectedBlockId: string | null;
  onSelect: (block: PaletteBlock) => void;
  onDragStart: (event: DragEvent<HTMLElement>, block: PaletteBlock) => void;
  onDragEnd: () => void;
  isAdmin: boolean;
  teacherValue: string;
  onTeacherChange: (value: string) => void;
  teacherOptions: string[];
  resolveTeacher: (block: PaletteBlock) => string | null;
  disabled: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden", disabled && "opacity-70")}>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody className="space-y-3">
        {isAdmin ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">{"O'qituvchi (ixtiyoriy)"}</p>
            <Select
              value={teacherValue}
              disabled={disabled}
              onChange={(event) => onTeacherChange(event.target.value)}
              className="h-9 py-0 text-xs"
            >
              <option value="">{"Kurs o'qituvchisi"}</option>
              {teacherOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
            {"Bu guruhda sizning fanlaringiz topilmadi"}
          </p>
        ) : (
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {blocks.map((block) => {
              const selected = selectedBlockId === block.id;
              return (
                <button
                  key={block.id}
                  type="button"
                  draggable={!disabled}
                  disabled={disabled}
                  onDragStart={(event) => onDragStart(event, block)}
                  onDragEnd={onDragEnd}
                  onClick={() => onSelect(block)}
                  className={cn(
                    "block w-full cursor-grab text-left active:cursor-grabbing disabled:cursor-default",
                    selected && "animate-fade-in",
                  )}
                >
                  <LegoSurface seed={block.title} color={block.color} selected={selected} className="px-3 py-2.5">
                    <p className="line-clamp-2 pr-8 text-sm font-semibold leading-snug">{block.title}</p>
                    <p className="mt-0.5 truncate text-[11px] opacity-70">
                      {resolveTeacher(block) ?? "O'qituvchisiz"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-medium ring-1 ring-black/5">
                        {block.lessonType}
                      </span>
                      <span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-medium ring-1 ring-black/5">
                        {block.room ?? "Xonasiz"}
                      </span>
                      <span className="rounded-full bg-brand-900/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {`${block.placedCount} ta qo'yilgan`}
                      </span>
                    </div>
                  </LegoSurface>
                </button>
              );
            })}
          </div>
        )}

        <p className="rounded-xl bg-brand-50/70 px-3 py-2 text-[11px] leading-relaxed text-brand-700">
          {disabled
            ? '"Guruh" rejimi va "Jadval" ko\'rinishida kataklarga qo\'yish mumkin.'
            : "Blokni katakka sudrab tashlang yoki blokni bosib, katakni bosing — avtomatik saqlanadi."}
        </p>
      </CardBody>
    </Card>
  );
}
