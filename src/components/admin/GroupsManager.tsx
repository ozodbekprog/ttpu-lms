"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Select, Table } from "@/components/ui";

export type AdminGroup = {
  id: string;
  name: string;
  year: number | null;
  userCount: number;
};

type ApiResult<T> = { ok: boolean; error?: string; data?: T };

type SubGroupItem = { id: string; name: string; userCount: number };
type StudentItem = { id: string; name: string; email: string; subGroupId: string | null };
type TeacherItem = { id: string; name: string };
type GroupDetails = {
  group: { id: string; name: string; curatorId: string | null };
  subGroups: SubGroupItem[];
  students: StudentItem[];
  teachers: TeacherItem[];
};

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700";

export default function GroupsManager({ groups }: { groups: AdminGroup[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, GroupDetails>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [subGroupName, setSubGroupName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);

  const search = query.trim().toLowerCase();
  const filtered = search ? groups.filter((group) => group.name.toLowerCase().includes(search)) : groups;

  function openCreate() {
    setMode("create");
    setEditId(null);
    setName("");
    setYear("");
    setError(null);
    setNotice(null);
  }

  function openEdit(group: AdminGroup) {
    setMode("edit");
    setEditId(group.id);
    setName(group.name);
    setYear(group.year ? String(group.year) : "");
    setError(null);
    setNotice(null);
  }

  function closeForm() {
    setMode(null);
    setEditId(null);
    setError(null);
  }

  async function send<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json().catch(() => null)) as ApiResult<T> | null;
      if (!res.ok || !json || !json.ok) {
        setError(json?.error ?? "Amalni bajarib bo'lmadi");
        return null;
      }
      return json;
    } catch {
      setError("Tarmoqda xatolik");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function loadDetails(groupId: string) {
    setDetailsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/subgroups`);
      const json = (await res.json().catch(() => null)) as ApiResult<GroupDetails> | null;
      if (!res.ok || !json || !json.ok || !json.data) {
        setError(json?.error ?? "Ma'lumotlarni yuklab bo'lmadi");
        return;
      }
      const data = json.data;
      setDetails((prev) => ({ ...prev, [groupId]: data }));
    } catch {
      setError("Tarmoqda xatolik");
    } finally {
      setDetailsLoading(false);
    }
  }

  function toggleDetails(groupId: string) {
    if (expandedId === groupId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(groupId);
    setSubGroupName("");
    setRenaming(null);
    if (!details[groupId]) void loadDetails(groupId);
  }

  function updateDetails(groupId: string, updater: (current: GroupDetails) => GroupDetails) {
    setDetails((prev) => {
      const current = prev[groupId];
      if (!current) return prev;
      return { ...prev, [groupId]: updater(current) };
    });
  }

  async function submit() {
    const payload = { name, year: year ? Number(year) : null };
    const json =
      mode === "create"
        ? await send("/api/admin/groups", "POST", payload)
        : await send(`/api/admin/groups/${editId}`, "PATCH", payload);
    if (!json) return;
    closeForm();
    setNotice(mode === "create" ? "Guruh yaratildi" : "Guruh yangilandi");
    router.refresh();
  }

  async function remove(group: AdminGroup) {
    if (!window.confirm(`${group.name} guruhi o'chirilsinmi?`)) return;
    const json = await send(`/api/admin/groups/${group.id}`, "DELETE");
    if (!json) return;
    setNotice("Guruh o'chirildi");
    if (expandedId === group.id) setExpandedId(null);
    router.refresh();
  }

  async function saveCurator(groupId: string, curatorId: string) {
    const json = await send(`/api/admin/groups/${groupId}`, "PATCH", { curatorId: curatorId || null });
    if (!json) return;
    updateDetails(groupId, (current) => ({
      ...current,
      group: { ...current.group, curatorId: curatorId || null },
    }));
    setNotice("Kurator saqlandi");
  }

  async function addSubGroup(groupId: string) {
    const value = subGroupName.trim();
    if (!value) return;
    const json = await send<SubGroupItem>(`/api/admin/groups/${groupId}/subgroups`, "POST", { name: value });
    if (!json?.data) return;
    const created = json.data;
    updateDetails(groupId, (current) => ({
      ...current,
      subGroups: [...current.subGroups, created].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    setSubGroupName("");
    setNotice("Kichik guruh qo'shildi");
  }

  async function renameSubGroup(groupId: string) {
    if (!renaming) return;
    const value = renaming.value.trim();
    if (!value) {
      setRenaming(null);
      return;
    }
    const json = await send<{ id: string; name: string }>(`/api/admin/subgroups/${renaming.id}`, "PATCH", {
      name: value,
    });
    if (!json?.data) return;
    const updated = json.data;
    updateDetails(groupId, (current) => ({
      ...current,
      subGroups: current.subGroups.map((item) =>
        item.id === updated.id ? { ...item, name: updated.name } : item,
      ),
    }));
    setRenaming(null);
    setNotice("Kichik guruh yangilandi");
  }

  async function removeSubGroup(groupId: string, item: SubGroupItem) {
    if (!window.confirm(`${item.name} kichik guruhi o'chirilsinmi?`)) return;
    const json = await send(`/api/admin/subgroups/${item.id}`, "DELETE");
    if (!json) return;
    updateDetails(groupId, (current) => ({
      ...current,
      subGroups: current.subGroups.filter((row) => row.id !== item.id),
      students: current.students.map((student) =>
        student.subGroupId === item.id ? { ...student, subGroupId: null } : student,
      ),
    }));
    setNotice("Kichik guruh o'chirildi");
  }

  async function assignStudent(groupId: string, studentId: string, subGroupId: string) {
    const nextId = subGroupId || null;
    const json = await send(`/api/admin/users/${studentId}`, "PATCH", { subGroupId: nextId });
    if (!json) return;
    updateDetails(groupId, (current) => {
      const students = current.students.map((student) =>
        student.id === studentId ? { ...student, subGroupId: nextId } : student,
      );
      return {
        ...current,
        students,
        subGroups: current.subGroups.map((item) => ({
          ...item,
          userCount: students.filter((student) => student.subGroupId === item.id).length,
        })),
      };
    });
    setNotice("Talaba biriktirildi");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={openCreate}>+ Yangi guruh</Button>
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Guruh qidirish..."
            className="pl-9"
          />
        </div>
      </div>

      {notice ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {notice}
        </span>
      ) : null}
      {error && !mode ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
          {error}
        </span>
      ) : null}

      {mode ? (
        <Card className="border-brand-200/70">
          <CardHeader
            title={mode === "create" ? "Yangi guruh" : "Guruhni tahrirlash"}
            action={
              <Button variant="ghost" size="sm" onClick={closeForm}>
                Yopish
              </Button>
            }
          />
          <CardBody>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div>
                <Label>Nomi</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="AI2-26" required minLength={2} />
              </div>
              <div>
                <Label>Yil</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2026"
                  min={2000}
                  max={2100}
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy || name.trim().length < 2}>
                  {busy ? "Saqlanmoqda..." : mode === "create" ? "Yaratish" : "Saqlash"}
                </Button>
              </div>
              {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Guruhlar" subtitle={`${filtered.length} ta`} />
        {groups.length === 0 ? (
          <CardBody>
            <EmptyState title="Guruhlar yo'q" description="Birinchi guruhni yarating." />
          </CardBody>
        ) : filtered.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Hech narsa topilmadi"
              description={`"${query.trim()}" bo'yicha guruh topilmadi.`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                  Tozalash
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table className="max-h-[68vh] overflow-y-auto">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Nomi</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Yil</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">A&apos;zolar</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 text-right font-semibold backdrop-blur">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => {
                const open = expandedId === group.id;
                const data = details[group.id] ?? null;
                return (
                  <Fragment key={group.id}>
                    <tr className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-600 text-[11px] font-semibold uppercase text-white shadow-sm">
                            {group.name.slice(0, 2)}
                          </span>
                          <span className="font-medium text-slate-900">{group.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-slate-600">{group.year ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={group.userCount > 0 ? "blue" : "slate"} className="gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {group.userCount} a&apos;zo
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant={open ? "primary" : "secondary"}
                            onClick={() => toggleDetails(group.id)}
                            aria-expanded={open}
                          >
                            Kichik guruhlar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openEdit(group)}>
                            Tahrirlash
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => remove(group)}
                          >
                            O&apos;chirish
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b border-slate-100 bg-slate-50/50 last:border-0">
                        <td colSpan={4} className="px-5 py-4">
                          {detailsLoading && !data ? (
                            <p className="text-sm text-slate-400">Yuklanmoqda…</p>
                          ) : !data ? (
                            <p className="text-sm text-slate-400">Ma&apos;lumot yuklanmadi.</p>
                          ) : (
                            <div className="grid gap-5 lg:grid-cols-2">
                              <div className="space-y-4">
                                <div>
                                  <Label>Kurator</Label>
                                  <Select
                                    value={data.group.curatorId ?? ""}
                                    disabled={busy}
                                    onChange={(event) => void saveCurator(group.id, event.target.value)}
                                  >
                                    <option value="">Tanlanmagan</option>
                                    {data.teachers.map((teacher) => (
                                      <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <div>
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <Label className="mb-0">Kichik guruhlar</Label>
                                    <span className="text-xs text-slate-400">{data.subGroups.length} ta</span>
                                  </div>
                                  {data.subGroups.length === 0 ? (
                                    <p className="text-xs text-slate-400">Hozircha kichik guruh yo&apos;q.</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {data.subGroups.map((item) => (
                                        <span
                                          key={item.id}
                                          className={cn(
                                            CHIP_CLASS,
                                            renaming?.id === item.id && "border-brand-400 ring-1 ring-brand-200",
                                          )}
                                        >
                                          <button
                                            type="button"
                                            className="font-semibold text-brand-800"
                                            onClick={() => setRenaming({ id: item.id, value: item.name })}
                                            title="Nomini o'zgartirish"
                                          >
                                            {item.name}
                                          </button>
                                          <span className="text-[10px] tabular-nums text-slate-400">
                                            {item.userCount}
                                          </span>
                                          <button
                                            type="button"
                                            aria-label={`${item.name} kichik guruhini o'chirish`}
                                            className="text-slate-400 transition-colors hover:text-rose-600"
                                            onClick={() => void removeSubGroup(group.id, item)}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {renaming ? (
                                    <div className="mt-2 flex gap-2">
                                      <Input
                                        value={renaming.value}
                                        autoFocus
                                        maxLength={20}
                                        onChange={(event) =>
                                          setRenaming((current) =>
                                            current ? { ...current, value: event.target.value } : current,
                                          )
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.preventDefault();
                                            void renameSubGroup(group.id);
                                          }
                                          if (event.key === "Escape") setRenaming(null);
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        disabled={busy || !renaming.value.trim()}
                                        onClick={() => void renameSubGroup(group.id)}
                                      >
                                        Saqlash
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                                        Bekor
                                      </Button>
                                    </div>
                                  ) : null}
                                  <div className="mt-2 flex gap-2">
                                    <Input
                                      value={subGroupName}
                                      maxLength={20}
                                      placeholder="Masalan: A"
                                      onChange={(event) => setSubGroupName(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          void addSubGroup(group.id);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      disabled={busy || !subGroupName.trim()}
                                      onClick={() => void addSubGroup(group.id)}
                                    >
                                      Qo&apos;shish
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                                  <Label className="mb-0">Talabalar</Label>
                                  <span className="text-xs text-slate-400">{data.students.length} ta</span>
                                </div>
                                {data.students.length === 0 ? (
                                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                                    Bu guruhda talaba yo&apos;q.
                                  </p>
                                ) : (
                                  <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                                    {data.students.map((student) => (
                                      <div
                                        key={student.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-slate-50"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-slate-800">{student.name}</p>
                                          <p className="truncate text-[11px] text-slate-400">{student.email}</p>
                                        </div>
                                        <div className="w-36 shrink-0">
                                          <Select
                                            value={student.subGroupId ?? ""}
                                            disabled={busy || data.subGroups.length === 0}
                                            onChange={(event) =>
                                              void assignStudent(group.id, student.id, event.target.value)
                                            }
                                            className="h-8 py-0 text-xs"
                                          >
                                            <option value="">Kichik guruhsiz</option>
                                            {data.subGroups.map((item) => (
                                              <option key={item.id} value={item.id}>
                                                {item.name}
                                              </option>
                                            ))}
                                          </Select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
