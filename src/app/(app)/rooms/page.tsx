import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Button, ButtonLink, Card, CardBody, EmptyState, Input, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { RoomCard, type RoomItem } from "@/components/rooms/room-card";
import RoomsManager from "@/components/rooms/RoomsManager";
import { ROOM_TYPE_LABELS, ROOM_TYPES, isRoomType, matchesRoomType } from "@/components/rooms/room-type";

function buildHref(q: string, type: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  const query = params.toString();
  return query ? `/rooms?${query}` : "/rooms";
}

function segmentClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
    active
      ? "border-brand-200 bg-brand-50 text-brand-800 shadow-sm"
      : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  );
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const type = typeof params.type === "string" && isRoomType(params.type) ? params.type : "";

  const where: Prisma.RoomWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { building: { contains: q, mode: "insensitive" } },
      { equipment: { contains: q, mode: "insensitive" } },
    ];
  }

  const rooms = await prisma.room.findMany({ where, orderBy: { name: "asc" } });
  const filtered = type ? rooms.filter((room) => matchesRoomType(room, type)) : rooms;

  const items: RoomItem[] = filtered.map((room) => ({
    id: room.id,
    name: room.name,
    building: room.building,
    capacity: room.capacity,
    equipment: room.equipment,
  }));

  const typeCounts = ROOM_TYPES.map((value) => ({
    value,
    count: rooms.filter((room) => matchesRoomType(room, value)).length,
  }));

  return (
    <>
      <PageHeader eyebrow="Kampus" title="Xonalar" subtitle={`${items.length} ta xona`} />

      <Card className="mb-6">
        <CardBody className="space-y-4 py-4">
          <form
            action="/rooms"
            method="get"
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="type" value={type} />
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <Input
                name="q"
                defaultValue={q}
                placeholder="Xona, bino yoki jihoz bo'yicha qidirish"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary" className="sm:w-auto">
              Qidirish
            </Button>
            {q || type ? (
              <Link
                href="/rooms"
                className="text-center text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-brand-800"
              >
                Tozalash
              </Link>
            ) : null}
          </form>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Turi
            </span>
            <Link href={buildHref(q, "")} className={segmentClass(type === "")}>
              Barchasi
              <span className="rounded-full bg-white/70 px-1.5 text-[11px] text-slate-500 ring-1 ring-slate-200/70">
                {rooms.length}
              </span>
            </Link>
            {typeCounts.map(({ value, count }) => (
              <Link key={value} href={buildHref(q, value)} className={segmentClass(type === value)}>
                {ROOM_TYPE_LABELS[value]}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] ring-1",
                    type === value
                      ? "bg-white/70 text-brand-600 ring-brand-200/70"
                      : "bg-white/70 text-slate-500 ring-slate-200/70",
                  )}
                >
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {q || type ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Natija:</span>
          <Badge tone="blue">{items.length} ta xona</Badge>
          {q ? <Badge>„{q}“</Badge> : null}
          {type ? <Badge>{ROOM_TYPE_LABELS[type]}</Badge> : null}
        </div>
      ) : null}

      {user.role === "ADMIN" ? (
        <RoomsManager rooms={items} />
      ) : items.length === 0 ? (
        <EmptyState
          title={q || type ? "Hech narsa topilmadi" : "Xonalar yo'q"}
          description={
            q || type
              ? "Qidiruv shartlariga mos xona topilmadi. So'zni yoki turni o'zgartirib ko'ring."
              : "Hozircha katalogda xonalar yo'q."
          }
          action={
            q || type ? (
              <ButtonLink href="/rooms" variant="secondary" size="sm">
                Barcha xonalar
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </>
  );
}
