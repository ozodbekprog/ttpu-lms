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
  initialRoom,
  initialDate,
  initialSlot,
}: {
  rooms: RoomOption[];
  initialBookings: BookingItem[];
  currentUserId: string;
  staff: boolean;
  isAdmin: boolean;
  initialRoom?: string;
  initialDate?: string;
  initialSlot?: number;
}) {
  const presetRoomName = initialRoom?.trim() ?? "";
  const presetRoom = presetRoomName
    ? rooms.find((room) => room.name.toLowerCase() === presetRoomName.toLowerCase()) ?? null
    : null;

  const [items, setItems] = useState<BookingItem[]>(initialBookings);
  const [roomMode, setRoomMode] = useState<RoomMode>(
    presetRoom
      ? "list"
      : presetRoomName
        ? "text"
        : rooms.length > 0
          ? "list"
          : "text",
  );
  const [roomId, setRoomId] = useState(presetRoom?.id ?? rooms[0]?.id ?? "");
  const [roomText, setRoomText] = useState(presetRoom ? "" : presetRoomName);
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [slot, setSlot] = useState(initialSlot ?? 1);
  const [purpose, setPurpose] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const firstFilterRun = useRef(true);

  const selectedRoom = rooms.find((room) => room.id === roomId) ?? null;
  const resolvedRoom = roomMode === "list" ? selectedRoom?.name ?? "" : roomText.trim();
  const today = todayIso();
  const filtersActive = Boolean(filterDate || filterRoom.trim());

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
      setConflict(false);
      return;
    }
    setSaving(true);
    setError(null);
    setConflict(false);
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
        setConflict(response.status === 409);
        return;
      }
      setPurpose("");
      setNotice(
        `${payload.data.roomName} — ${fmtDate(payload.data.date)}, ${payload.data.slot}-par band qilindi`,
      );
      await reload();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring");
      setConflict(false);
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
    setConflict(false);
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

      <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <Card className="relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
            <CardHeader title="Yangi bron" subtitle="Xona, sana va parni tanlang" />
            <CardBody>
              <form onSubmit={submit} className="space-y-5">
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
                  <div className="grid grid-cols-4 gap-2">
                    {SLOTS.map((value) => {
                      const active = slot === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSlot(value)}
                          className={cn(
                            "flex flex-col items-center rounded-xl border px-1 py-2 text-center transition-all duration-150",
                            active
                              ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm ring-2 ring-brand-500/15"
                              : "border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-slate-700",
                          )}
                        >
                          <span className="text-sm font-semibold leading-none">{value}-par</span>
                          <span
                            className={cn(
                              "mt-1 text-[10px] leading-none",
                              active ? "text-brand-600" : "text-slate-400",
                            )}
                          >
                            {SLOT_TIMES[value]}
                          </span>
                        </button>
                      );
                    })}
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

                <div className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tanlov
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {resolvedRoom || "Xona tanlanmagan"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fmtDate(date)} · {slot}-par · {SLOT_TIMES[slot]}
                  </p>
                </div>

                {error ? (
                  <div
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ring-1",
                      conflict
                        ? "bg-amber-50 text-amber-800 ring-amber-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200",
                    )}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                    </svg>
                    <div>
                      <p className="font-semibold">{conflict ? "Bu vaqt band" : "Xatolik"}</p>
                      <p className={cn("mt-0.5 text-xs", conflict ? "text-amber-700" : "text-rose-600")}>
                        {conflict
                          ? "Tanlangan xona, sana va par allaqachon band qilingan. Boshqa par yoki xonani tanlang."
                          : error}
                      </p>
                    </div>
                  </div>
                ) : null}
                {notice ? (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <p className="font-medium">{notice}</p>
                  </div>
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
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Filtr
                  </p>
                  {filtersActive ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-brand-800"
                    >
                      Tozalash
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                      </span>
                      <Input
                        value={filterRoom}
                        onChange={(event) => setFilterRoom(event.target.value)}
                        placeholder="Xona nomi"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <CardBody className="p-0">
              {items.length === 0 ? (
                filtersActive ? (
                  <EmptyState
                    title="Filtrga mos bron topilmadi"
                    description="Sana yoki xona filtrini o'zgartirib qayta ko'ring."
                    action={
                      <Button variant="secondary" size="sm" onClick={resetFilters}>
                        Filtrlarni tozalash
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    title={staff ? "Hozircha bronlar yo'q" : "Sizda hali bron yo'q"}
                    description="Chapdagi shakl orqali xonani band qiling — bron shu yerda ko'rinadi."
                  />
                )
              ) : (
                <ul className="space-y-3 p-4 sm:p-5">
                  {items.map((booking) => {
                    const active = booking.status === "ACTIVE";
                    return (
                      <li
                        key={booking.id}
                        className={cn(
                          "relative overflow-hidden rounded-xl border p-4 transition-all duration-200",
                          active
                            ? "border-slate-200 bg-white hover:border-brand-200 hover:shadow-card"
                            : "border-slate-200/70 bg-slate-50/70",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute inset-y-0 left-0 w-1",
                            active ? "bg-emerald-400" : "bg-slate-300",
                          )}
                        />
                        <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={cn(
                                  "font-semibold tracking-tight",
                                  active ? "text-brand-950" : "text-slate-500",
                                )}
                              >
                                {booking.roomName}
                              </p>
                              <Badge tone={active ? "green" : "slate"}>
                                {active ? "Faol" : "Bekor qilingan"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{fmtDate(booking.date)}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 font-medium",
                                  active
                                    ? "bg-brand-50 text-brand-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {booking.slot}-par · {SLOT_TIMES[booking.slot]}
                              </span>
                              {booking.purpose ? (
                                <span className="text-slate-500">{booking.purpose}</span>
                              ) : null}
                            </div>
                            {staff ? (
                              <div className="mt-2.5 flex items-center gap-2">
                                <Avatar name={booking.user.name} size={22} />
                                <span className="text-xs text-slate-500">
                                  {booking.user.name}
                                  {booking.user.group ? ` · ${booking.user.group.name}` : ""}
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {canCancel(booking) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600! hover:bg-rose-50! hover:text-rose-700!"
                                disabled={cancellingId === booking.id}
                                onClick={() => {
                                  void cancelBooking(booking);
                                }}
                              >
                                {cancellingId === booking.id ? "Bekor qilinmoqda…" : "Bekor qilish"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
