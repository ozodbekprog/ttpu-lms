import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRoomType, matchesRoomType } from "@/components/rooms/room-type";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  building: z.string().trim().max(80).nullable().optional(),
  capacity: z.number().int().min(0).max(10000).nullable().optional(),
  equipment: z.string().trim().max(500).nullable().optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") ?? "";

  const where: Prisma.RoomWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { building: { contains: q, mode: "insensitive" } },
      { equipment: { contains: q, mode: "insensitive" } },
    ];
  }

  const rooms = await prisma.room.findMany({ where, orderBy: { name: "asc" } });
  const data = isRoomType(type) ? rooms.filter((room) => matchesRoomType(room, type)) : rooms;

  return Response.json({ ok: true, data });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Xona ma'lumotlarini to'g'ri kiriting" }, { status: 400 });
  }

  const name = parsed.data.name;
  const existing = await prisma.room.findUnique({ where: { name } });
  if (existing) return Response.json({ ok: false, error: "Bu nomdagi xona mavjud" }, { status: 409 });

  const room = await prisma.room.create({
    data: {
      name,
      building: parsed.data.building ?? null,
      capacity: parsed.data.capacity ?? null,
      equipment: parsed.data.equipment ?? null,
    },
  });

  return Response.json({ ok: true, data: room }, { status: 201 });
}
