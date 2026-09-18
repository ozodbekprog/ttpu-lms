import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { BookingsBoard } from "@/components/bookings/bookings-board";
import type { BookingItem, RoomOption } from "@/components/bookings/types";

export default async function BookingsPage() {
  const user = await requireUser();
  const staff = isStaff(user.role);

  const [rooms, rows] = await Promise.all([
    prisma.room.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, building: true, capacity: true },
    }),
    prisma.roomBooking.findMany({
      where: staff ? {} : { userId: user.id },
      orderBy: [{ date: "desc" }, { slot: "asc" }],
      include: {
        user: {
          select: { id: true, name: true, email: true, group: { select: { name: true } } },
        },
      },
    }),
  ]);

  const roomOptions: RoomOption[] = rooms;
  const bookings: BookingItem[] = rows.map((row) => ({
    id: row.id,
    roomName: row.roomName,
    date: row.date.toISOString().slice(0, 10),
    slot: row.slot,
    purpose: row.purpose,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    user: row.user,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Kampus"
        title="Xona band qilish"
        subtitle={
          staff
            ? "Barcha bronlar — sana va xona bo'yicha filtrlang"
            : "Bo'sh xonani tanlang, sanani va parni belgilang"
        }
      />
      <BookingsBoard
        rooms={roomOptions}
        initialBookings={bookings}
        currentUserId={user.id}
        staff={staff}
        isAdmin={user.role === "ADMIN"}
      />
    </>
  );
}
