"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Table } from "@/components/ui";

export type AdminGroup = {
  id: string;
  name: string;
  year: number | null;
  userCount: number;
};

type ApiResult = { ok: boolean; error?: string };

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

  async function send(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
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
    router.refresh();
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
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-semibold">Nomi</th>
                <th className="px-5 py-3 font-semibold">Yil</th>
                <th className="px-5 py-3 font-semibold">Foydalanuvchilar</th>
                <th className="px-5 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => (
                <tr
                  key={group.id}
                  className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">{group.name}</td>
                  <td className="px-5 py-3 text-slate-600">{group.year ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone="slate">{group.userCount} ta</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
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
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
