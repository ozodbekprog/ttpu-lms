import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoomUsage } from "@/components/rooms/room-data";
import { parseIsoDate, resolveWeekStart } from "@/components/rooms/room-week";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const room = await prisma.room.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!room) return Response.json({ ok: false, error: "Xona topilmadi" }, { status: 404 });

  const url = new URL(request.url);
  const weekParam = url.searchParams.get("week");
  if (weekParam && !parseIsoDate(weekParam)) {
    return Response.json({ ok: false, error: "Hafta sanasi noto'g'ri" }, { status: 400 });
  }

  const week = resolveWeekStart(weekParam);
  const usage = await getRoomUsage(room.name, week);

  return Response.json({ ok: true, data: usage });
}
