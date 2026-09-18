import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mondayOfIso, tashkentToday } from "@/app/(app)/schedule/print/week";
import { buildIcs } from "./ics";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const groupId =
    url.searchParams.get("groupId") ?? (user.role === "STUDENT" ? user.groupId : null);
  if (!groupId) {
    return Response.json({ ok: false, error: "groupId ko'rsatilmagan" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });
  if (!group) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  if (user.role === "STUDENT" && user.groupId !== group.id) {
    return Response.json(
      { ok: false, error: "Bu guruh jadvalini ko'rish huquqingiz yo'q" },
      { status: 403 },
    );
  }

  const monday = mondayOfIso(url.searchParams.get("week") ?? tashkentToday());
  const entries = await prisma.scheduleEntry.findMany({
    where: { groupId: group.id },
    orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
  });

  const body = buildIcs(group, entries, monday);
  const filename = `${group.name.replace(/[^\w.-]+/g, "-")}-jadval.ics`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
