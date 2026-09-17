"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
} from "@/components/ui";
import { cn, dayName } from "@/lib/utils";

export type ScheduleEntryItem = {
  id: string;
  groupId: string;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  parity: string | null;
};

type GroupItem = { id: string; name: string };

type ApiResponse = { ok: true; data: unknown } | { ok: false; error: string };

type FormState = {
  id: string | null;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string;
  room: string;
  parity: "" | "odd" | "even";
};

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const SLOT_TIMES: Record<number, string> = {
  1: "09:00–10:20",
  2: "10:30–11:50",
  3: "12:00–13:20",
  4: "14:20–15:40",
  5: "15:50–17:10",
  6: "17:20–18:40",
  7: "18:50–20:10",
  8: "20:20–21:40",
};

const PARITY_LABEL: Record<string, string> = {
  odd: "Toq hafta",
  even: "Juft hafta",
};

export function ScheduleBoard({
  canEdit,
  groups,
  selectedGroupId,
  entries,
  today,
}: {
  canEdit: boolean;
  groups: GroupItem[];
  selectedGroupId: string | null;
  entries: ScheduleEntryItem[];
  today: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const selectedGroupName = selectedGroup?.name ?? null;

  function changeGroup(groupId: string) {
    if (!canEdit) return;
    router.push(groupId ? `/schedule?groupId=${encodeURIComponent(groupId)}` : "/schedule");
  }

  function openAdd(day: number, slot: number) {
    setError(null);
    setForm({ id: null, dayOfWeek: day, slot, subject: "", teacher: "", room: "", parity: "" });
  }

  function openEdit(entry: ScheduleEntryItem) {
    setError(null);
    setForm({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      slot: entry.slot,
      subject: entry.subject,
      teacher: entry.teacher ?? "",
      room: entry.room ?? "",
      parity: entry.parity === "odd" || entry.parity === "even" ? entry.parity : "",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const payload = {
      dayOfWeek: form.dayOfWeek,
      slot: form.slot,
      subject: form.subject.trim(),
      teacher: form.teacher.trim() || null,
      room: form.room.trim() || null,
      parity: form.parity || null,
    };
    try {
      const response = form.id
        ? await fetch(`/api/schedule/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, groupId: selectedGroupId }),
          });
      const json = (await response.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setForm(null);
      router.refresh();
    } catch {
      setError("Server bilan aloqa xatosi");
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: ScheduleEntryItem) {
    if (!window.confirm(`${entry.subject} darsini o'chirishni tasdiqlaysizmi?`)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/schedule/${entry.id}`, { method: "DELETE" });
      const json = (await response.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Server bilan aloqa xatosi");
    } finally {
      setSaving(false);
    }
  }

  function entriesAt(day: number, slot: number) {
    return entries.filter((entry) => entry.dayOfWeek === day && entry.slot === slot);
  }

  if (groups.length === 0 || !selectedGroupId) {
    return (
      <EmptyState
        title="Guruh topilmadi"
        description="Jadvalni ko'rish uchun sizga guruh biriktirilgan bo'lishi kerak."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Label>Guruh</Label>
            <Select
              value={selectedGroupId}
              onChange={(event) => changeGroup(event.target.value)}
              disabled={!canEdit}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </div>
          {canEdit ? (
            <Button onClick={() => openAdd(today, 1)}>{"Dars qo'shish"}</Button>
          ) : null}
          <p className="text-xs text-slate-500">{entries.length} ta yozuv</p>
        </CardBody>
      </Card>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {form ? (
        <Card>
          <CardHeader
            title={form.id ? "Yozuvni tahrirlash" : "Yangi dars qo'shish"}
            subtitle={selectedGroupName ?? undefined}
          />
          <CardBody>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Kun</Label>
                <Select
                  value={form.dayOfWeek}
                  onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })}
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {dayName(day)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Par</Label>
                <Select
                  value={form.slot}
                  onChange={(event) => setForm({ ...form, slot: Number(event.target.value) })}
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}-par ({SLOT_TIMES[slot]})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Fan</Label>
                <Input
                  required
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  placeholder="MATH 1"
                />
              </div>
              <div>
                <Label>{"O'qituvchi"}</Label>
                <Input
                  value={form.teacher}
                  onChange={(event) => setForm({ ...form, teacher: event.target.value })}
                  placeholder="A.MAMANAZAROV"
                />
              </div>
              <div>
                <Label>Xona</Label>
                <Input
                  value={form.room}
                  onChange={(event) => setForm({ ...form, room: event.target.value })}
                  placeholder="205-xona"
                />
              </div>
              <div>
                <Label>Hafta turi (ixtiyoriy)</Label>
                <Select
                  value={form.parity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({ ...form, parity: value === "odd" || value === "even" ? value : "" });
                  }}
                >
                  <option value="">Har hafta</option>
                  <option value="odd">Toq hafta</option>
                  <option value="even">Juft hafta</option>
                </Select>
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={saving}>
                  {form.id ? "Saqlash" : "Qo'shish"}
                </Button>
                <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
                  Bekor qilish
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Haftalik jadval" subtitle={selectedGroupName ?? undefined} />
        <CardBody>
          <Table className="[&>table]:min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">Vaqt</th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      "px-3 py-2 font-medium",
                      day === today && "bg-blue-50 text-blue-700",
                    )}
                  >
                    {dayName(day)}
                    {day === today ? <span className="ml-1 text-[10px] font-semibold">bugun</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="border-b border-slate-100 align-top">
                  <td className="w-32 px-3 py-3">
                    <p className="text-sm font-medium text-slate-900">{slot}-par</p>
                    <p className="text-xs text-slate-500">{SLOT_TIMES[slot]}</p>
                  </td>
                  {DAYS.map((day) => {
                    const cellEntries = entriesAt(day, slot);
                    return (
                      <td
                        key={day}
                        className={cn("px-2 py-2", day === today && "bg-blue-50/40")}
                      >
                        <div className="space-y-2">
                          {cellEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                            >
                              <p className="text-sm font-medium text-slate-900">{entry.subject}</p>
                              {entry.teacher ? (
                                <p className="text-xs text-slate-500">{entry.teacher}</p>
                              ) : null}
                              {entry.room ? (
                                <p className="text-xs text-slate-500">{entry.room}</p>
                              ) : null}
                              {entry.parity ? (
                                <Badge tone="amber" className="mt-1">
                                  {PARITY_LABEL[entry.parity] ?? entry.parity}
                                </Badge>
                              ) : null}
                              {canEdit ? (
                                <div className="mt-1.5 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => openEdit(entry)}
                                    disabled={saving}
                                  >
                                    Tahrir
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-rose-600"
                                    onClick={() => remove(entry)}
                                    disabled={saving}
                                  >
                                    {"O'chirish"}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                          {canEdit && cellEntries.length === 0 ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full border border-dashed border-slate-300 text-slate-400"
                              onClick={() => openAdd(day, slot)}
                              disabled={saving}
                            >
                              {"Qo'shish"}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
