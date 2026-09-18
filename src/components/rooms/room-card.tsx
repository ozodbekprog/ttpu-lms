import type { ReactNode } from "react";
import { Badge, Card, CardBody } from "@/components/ui";
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_TONES,
  roomType,
  type RoomLike,
} from "@/components/rooms/room-type";

export type RoomItem = RoomLike & {
  id: string;
  capacity: number | null;
};

export function RoomCard({ room, actions }: { room: RoomItem; actions?: ReactNode }) {
  const type = roomType(room);
  const equipment = room.equipment
    ? room.equipment
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <Card className="flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200/80 hover:shadow-[0_2px_6px_rgba(16,24,40,0.05),0_16px_36px_-16px_rgba(29,52,96,0.22)]">
      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight text-slate-900">{room.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M10 21v-4h4v4" />
              </svg>
              {room.building ?? "Bino ko'rsatilmagan"}
            </p>
          </div>
          <Badge tone={ROOM_TYPE_TONES[type]} className="shrink-0">
            {ROOM_TYPE_LABELS[type]}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {room.capacity === null ? "Sig'im ko'rsatilmagan" : `${room.capacity} o'rin`}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Jihozlar</p>
          {equipment.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {equipment.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Ko&apos;rsatilmagan</p>
          )}
        </div>

        {actions ? <div className="mt-auto flex justify-end gap-1.5 pt-1">{actions}</div> : null}
      </CardBody>
    </Card>
  );
}
