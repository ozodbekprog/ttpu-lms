import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { findAvailableRooms } from "@/components/rooms/room-data";
import { parseIsoDate } from "@/components/rooms/room-week";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.coerce.number().int().min(1).max(8),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date") ?? "",
    slot: url.searchParams.get("slot") ?? "",
  });
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Sana va parni to'g'ri kiriting" }, { status: 400 });
  }
  if (!parseIsoDate(parsed.data.date)) {
    return Response.json({ ok: false, error: "Sana noto'g'ri" }, { status: 400 });
  }

  const rooms = await findAvailableRooms(parsed.data.date, parsed.data.slot);
  return Response.json({ ok: true, data: rooms });
}
