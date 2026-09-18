"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Select,
  Stat,
  Textarea,
} from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { SLOT_TIMES, todayIso } from "@/components/attendance/lesson-utils";
import type { BookingItem, RoomOption } from "./types";

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];
type RoomMode = "list" | "text";

type ListPayload =
  | { ok: true; data: { bookings: BookingItem[] } }
  | { ok: false; error: string };

type CreatePayload = { ok: true; data: BookingItem } | { ok: false; error: string };

type CancelPayload =
  | { ok: true; data: { id: string; status: string } }
  | { ok: false; error: string };

function roomLabel(room: RoomOption) {
  const parts = [room.name];
  if (room.building) parts.push(room.building);
  if (room.capacity) parts.push(`${room.capacity} o'rin`);
  return parts.join(" · ");
}

export function BookingsBoard({
  rooms,
  initialBookings,
  currentUserId,
  staff,
  isAdmin,
}: {
  rooms: RoomOption[];
  initialBookings: BookingItem[];
  currentUserId: string;
  staff: boolean;
  isAdmin: boolean;
}) {
  const [items, setItems] = useState<BookingItem[]>(initialBookings);
  const [roomMode, setRoomMode] = useState<RoomMode>(rooms.length > 0 ? "list" : "text");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [roomText, setRoomText] = useState("");
  const [date, setDate] = useState(todayIso());
  const [slot, setSlot] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const firstFilterRun = useRef(true);

  const selectedRoom = rooms.find((room) => room.id === roomId) ?? null;
  const resolvedRoom = roomMode === "list" ? selectedRoom?.name ?? "" : roomText.trim();
  const today = todayIso();

  const reload = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterDate) params.set("date", filterDate);
    if (filterRoom.trim()) params.set("room", filterRoom.trim());
    const query = params.toString();
    try {
      const response = await fetch(`/api/bookings${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as ListPayload | null;
      if (payload?.ok) {
        setItems(payload.data.bookings);
        setError(null);
      } else if (payload && !payload.ok) {
        setError(payload.error);
      }
    } catch {
      setError("Bronlarni yuklab bo'lmadi");
    }
  }, [filterDate, filterRoom]);

  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void reload();
    }, 250);
    return () => clearTimeout(timer);
  }, [reload]);

  const activeCount = useMemo(
    () => items.filter((item) => item.status === "ACTIVE").length,
    [items],
  );
  const todayCount = useMemo(
    () => items.filter((item) => item.status === "ACTIVE" && item.date === today).length,
    [items, today],
  );
  const cancelledCount = items.length - activeCount;

  function canCancel(booking: BookingItem) {
    return (
      booking.status === "ACTIVE" && (booking.userId === currentUserId || isAdmin)
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedRoom) {
      setError("Xona nomini kiriting yoki ro'yxatdan tanlang");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: resolvedRoom,
          date,
          slot,
          purpose: purpose.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as CreatePayload | null;
      if (!response.ok || !payload || !payload.ok) {
        setError(payload && !payload.ok ? payload.error : "Bron qilib bo'lmadi");
        return;
      }
      setPurpose("");
      setNotice(
        `${payload.data.roomName} — ${fmtDate(payload.data.date)}, ${payload.data.slot}-par band qilindi`,
      );
      await reload();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking(booking: BookingItem) {
    if (
      !window.confirm(
        `${booking.roomName} — ${fmtDate(booking.date)}, ${booking.slot}-par broni bekor qilinsinmi?`,
      )
    ) {
      return;
    }
    setCancellingId(booking.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as CancelPayload | null;
      if (!response.ok || !payload || !payload.ok) {
        setError(payload && !payload.ok ? payload.error : "Bekor qilib bo'lmadi");
        return;
      }
      setNotice("Bron bekor qilindi");
      await reload();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring");
    } finally {
      setCancellingId(null);
    }
  }

  function resetFilters() {
    setFilterDate("");
    setFilterRoom("");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-up">
          <Stat
            label={staff ? "Faol bronlar" : "Faol bronlarim"}
            value={activeCount}
            hint={`Jami ${items.length} ta bron`}
          />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <Stat label="Bugun" value={todayCount} hint={fmtDate(today)} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <Stat
            label={staff ? "Bekor qilingan" : "Bekor qilinganlarim"}
            value={cancelledCount}
            hint="Bekor qilingan vaqtlar bo'shatiladi"
          />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <Card className="relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
            <CardHeader title="Yangi bron" subtitle="Xona, sana va parni tanlang" />
            <CardBody>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label>Xona</Label>
                  {rooms.length > 0 ? (
                    <div className="mb-2 flex gap-1 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setRoomMode("list")}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          roomMode === "list"
                            ? "bg-white text-brand-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Ro&apos;yxatdan
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomMode("text")}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          roomMode === "text"
                            ? "bg-white text-brand-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        Qo&apos;lda kiritish
                      </button>
                    </div>
                  ) : null}
                  {roomMode === "list" && rooms.length > 0 ? (
                    <Select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {roomLabel(room)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      value={roomText}
                      onChange={(event) => setRoomText(event.target.value)}
                      placeholder="Masalan: 305-xona"
                      maxLength={100}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sana</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Par</Label>
                    <Select
                      value={slot}
                      onChange={(event) => setSlot(Number(event.target.value))}
                    >
                      {SLOTS.map((value) => (
                        <option key={value} value={value}>
                          {value}-par · {SLOT_TIMES[value]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Maqsad</Label>
                  <Textarea
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Masalan: guruh bilan loyiha uchrashuvi"
                  />
                </div>

                {error ? (
                  <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>
                ) : null}
                {notice ? (
                  <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                    {notice}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Bron qilinmoqda…" : "Bron qilish"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "140ms" }}>
          <Card className="overflow-hidden">
            <CardHeader
              title="Bronlar"
              subtitle={staff ? "Barcha foydalanuvchilar bronlari" : "Sizning bronlaringiz"}
              action={<Badge tone="blue">{items.length} ta</Badge>}
            />

            {staff ? (
              <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <Label>Sana bo&apos;yicha</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(event) => setFilterDate(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Xona bo&apos;yicha</Label>
                  <Input
                    value={filterRoom}
                    onChange={(event) => setFilterRoom(event.target.value)}
                    placeholder="Xona nomi"
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" onClick={resetFilters}>
                    Tozalash
                  </Button>
                </div>
              </div>
            ) : null}

            <CardBody className="p-0">
              {items.length === 0 ? (
                <EmptyState
                  title="Hozircha bronlar yo'q"
                  description="Chapdagi shakl orqali xonani band qiling — bron shu yerda ko'rinadi."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold tracking-tight text-brand-950">
                            {booking.roomName}
                          </p>
                          <Badge tone="blue">
                            {booking.slot}-par · {SLOT_TIMES[booking.slot]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {fmtDate(booking.date)}
                          {booking.purpose ? ` · ${booking.purpose}` : ""}
                        </p>
                        {staff ? (
                          <div className="mt-2 flex items-center gap-2">
                            <Avatar name={booking.user.name} size={22} />
                            <span className="text-xs text-slate-500">
                              {booking.user.name}
                              {booking.user.group ? ` · ${booking.user.group.name}` : ""}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={booking.status === "ACTIVE" ? "green" : "slate"}>
                          {booking.status === "ACTIVE" ? "Faol" : "Bekor qilingan"}
                        </Badge>
                        {canCancel(booking) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600! hover:bg-rose-50!"
                            disabled={cancellingId === booking.id}
                            onClick={() => {
                              void cancelBooking(booking);
                            }}
                          >
                            {cancellingId === booking.id ? "Bekor qilinmoqda…" : "Bekor qilish"}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
