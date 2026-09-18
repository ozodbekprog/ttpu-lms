import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, ButtonLink, Card, CardBody, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { RoomCard, type RoomItem } from "@/components/rooms/room-card";
import RoomsManager from "@/components/rooms/RoomsManager";
import { ROOM_TYPE_LABELS, ROOM_TYPES, isRoomType, matchesRoomType } from "@/components/rooms/room-type";

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

  return (
    <>
      <PageHeader eyebrow="Kampus" title="Xonalar" subtitle={`${items.length} ta xona`} />

      <form action="/rooms" method="get" className="mb-6">
        <Card>
          <CardBody className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-80">
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
            <Select name="type" defaultValue={type} className="w-full sm:w-48">
              <option value="">Barcha turlar</option>
              {ROOM_TYPES.map((value) => (
                <option key={value} value={value}>
                  {ROOM_TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Qidirish
            </Button>
            {q || type ? (
              <Link
                href="/rooms"
                className="text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-brand-800"
              >
                Tozalash
              </Link>
            ) : null}
          </CardBody>
        </Card>
      </form>

      {user.role === "ADMIN" ? (
        <RoomsManager rooms={items} />
      ) : items.length === 0 ? (
        <EmptyState
          title={q || type ? "Hech narsa topilmadi" : "Xonalar yo'q"}
          description={
            q || type
              ? "Qidiruv shartlariga mos xona topilmadi."
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
