import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const booking = await prisma.roomBooking.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!booking) {
    return Response.json({ ok: false, error: "Bron topilmadi" }, { status: 404 });
  }

  if (booking.userId !== user.id && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Faqat o'z broningizni bekor qilishingiz mumkin" }, { status: 403 });
  }

  if (booking.status === "CANCELLED") {
    return Response.json({ ok: true, data: { id: booking.id, status: booking.status } });
  }

  const updated = await prisma.roomBooking.update({
    where: { id },
    data: { status: "CANCELLED" },
    select: { id: true, status: true },
  });

  return Response.json({ ok: true, data: updated });
}
