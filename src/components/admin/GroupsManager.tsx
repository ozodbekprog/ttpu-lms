"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Table } from "@/components/ui";

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
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate}>+ Yangi guruh</Button>
        {notice ? <span className="text-sm text-emerald-600">{notice}</span> : null}
        {error && !mode ? <span className="text-sm text-rose-600">{error}</span> : null}
      </div>

      {mode ? (
        <Card>
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
        <CardHeader title="Guruhlar" subtitle={`${groups.length} ta`} />
        {groups.length === 0 ? (
          <CardBody>
            <EmptyState title="Guruhlar yo'q" description="Birinchi guruhni yarating." />
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Nomi</th>
                <th className="px-5 py-3 font-medium">Yil</th>
                <th className="px-5 py-3 font-medium">Foydalanuvchilar</th>
                <th className="px-5 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-900">{group.name}</td>
                  <td className="px-5 py-3 text-slate-600">{group.year ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{group.userCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(group)}>
                        Tahrirlash
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => remove(group)}
                      >
                        O'chirish
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
