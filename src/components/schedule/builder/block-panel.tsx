"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { dayName } from "@/lib/utils";
import type { ScheduleStatus } from "@/components/schedule/types";
import type { BuilderEntry } from "./types";

const STATUS_OPTIONS: Array<{ value: ScheduleStatus; label: string }> = [
  { value: "NORMAL", label: "O'zgarishsiz" },
  { value: "CHANGED", label: "O'zgargan" },
  { value: "MOVED", label: "Ko'chirilgan" },
  { value: "CANCELLED", label: "Bekor qilindi" },
];

function toStatus(value: string): ScheduleStatus {
  return value === "CHANGED" || value === "MOVED" || value === "CANCELLED" ? value : "NORMAL";
}

export function BlockPanel({
  entry,
  canManage,
  pending,
  onClose,
  onSaveRoom,
  onChangeStatus,
  onDelete,
}: {
  entry: BuilderEntry;
  canManage: boolean;
  pending: boolean;
  onClose: () => void;
  onSaveRoom: (room: string) => void;
  onChangeStatus: (status: ScheduleStatus) => void;
  onDelete: (entry: BuilderEntry) => void;
}) {
  const [draft, setDraft] = useState<{ id: string; value: string } | null>(null);
  const roomValue = draft?.id === entry.id ? draft.value : entry.room ?? "";
  const title = entry.subjectRef?.name ?? entry.subject;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm">
      <Card className="border-brand-200 shadow-xl">
        <CardHeader
          title={title}
          subtitle={`${dayName(entry.dayOfWeek)}, ${entry.slot}-par · ${SLOT_TIMES[entry.slot]}`}
          action={
            <Button variant="ghost" size="sm" onClick={onClose}>
              Yopish
            </Button>
          }
        />
        <CardBody className="space-y-3">
          {entry.teacher ? (
            <p className="text-xs text-slate-500">
              {"O'qituvchi: "}
              <span className="font-medium text-slate-700">{entry.teacher}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            {entry.subGroup ? <Badge tone="purple">{entry.subGroup} kichik guruh</Badge> : null}
            {entry.lessonType ? <Badge tone="blue">{entry.lessonType}</Badge> : null}
            {entry.parity ? (
              <Badge tone="amber">{entry.parity === "odd" ? "Toq hafta" : "Juft hafta"}</Badge>
            ) : (
              <Badge tone="slate">Har hafta</Badge>
            )}
            {!canManage ? <Badge tone="rose">Faqat egasi tahrirlaydi</Badge> : null}
          </div>

          <div>
            <Label>Xona</Label>
            <div className="flex gap-2">
              <Input
                value={roomValue}
                disabled={!canManage || pending}
                onChange={(event) => setDraft({ id: entry.id, value: event.target.value })}
                placeholder="Masalan: 205"
              />
              <Button
                variant="secondary"
                disabled={!canManage || pending || roomValue.trim() === (entry.room ?? "")}
                onClick={() => onSaveRoom(roomValue.trim())}
              >
                Saqlash
              </Button>
            </div>
          </div>

          <div>
            <Label>Holat</Label>
            <Select
              value={entry.status}
              disabled={!canManage || pending}
              onChange={(event) => onChangeStatus(toStatus(event.target.value))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end">
            <Button variant="danger" disabled={!canManage || pending} onClick={() => onDelete(entry)}>
              {"O'chirish"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
