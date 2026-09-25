import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ROOM_TYPE_ICONS,
  ROOM_TYPE_LABELS,
  ROOM_TYPE_META,
  ROOM_TYPE_TONES,
  roomType,
  type RoomLike,
  type RoomType,
} from "@/components/rooms/room-type";

export type RoomItem = RoomLike & {
  id: string;
  capacity: number | null;
};

function TypeGlyph({ type }: { type: RoomType }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ROOM_TYPE_ICONS[type].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function RoomCard({
  room,
  actions,
  href,
}: {
  room: RoomItem;
  actions?: ReactNode;
  href?: string;
}) {
  const type = roomType(room);
  const meta = ROOM_TYPE_META[type];
  const equipment = room.equipment
    ? room.equipment
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200/80 hover:shadow-lift">
      <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", meta.stripe)} />
      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors",
              meta.tile,
            )}
          >
            <TypeGlyph type={type} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold tracking-tight text-slate-900">{room.name}</h3>
              <Badge tone={ROOM_TYPE_TONES[type]} className="shrink-0">
                {ROOM_TYPE_LABELS[type]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-slate-600"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M10 21v-4h4v4" />
              </svg>
              <span className="truncate">{room.building ?? "Bino ko'rsatilmagan"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-600"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {room.capacity === null ? "Sig'im yo'q" : `${room.capacity} o'rin`}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-600"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
            </svg>
            {equipment.length ? `${equipment.length} ta jihoz` : "Jihoz yo'q"}
          </span>
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Jihozlar</p>
          {equipment.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {equipment.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                >
                  <span className="size-1 rounded-full bg-slate-400" />
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-slate-600">Ko&apos;rsatilmagan</p>
          )}
        </div>

        {actions || href ? (
          <div className="mt-auto flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
            {actions}
            {href ? (
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50"
              >
                Haftalik bandlik
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </Link>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
