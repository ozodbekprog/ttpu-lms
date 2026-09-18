"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
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
  Table,
} from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  group: { id: string; name: string } | null;
};

export type GroupOption = { id: string; name: string };

type FormMode = "create" | "edit" | "reset";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: Role;
  groupId: string;
  isActive: boolean;
};

type ApiResult = { ok: boolean; error?: string };

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "STUDENT",
  groupId: "",
  isActive: true,
};

const ROLE_META: Record<
  Role,
  { label: string; tone: "brand" | "purple" | "slate"; dot: string; ring: string }
> = {
  ADMIN: { label: "Administrator", tone: "brand", dot: "bg-brand-500", ring: "ring-brand-200/80" },
  TEACHER: { label: "O'qituvchi", tone: "purple", dot: "bg-purple-500", ring: "ring-purple-200/80" },
  STUDENT: { label: "Talaba", tone: "slate", dot: "bg-slate-400", ring: "ring-slate-200" },
};

export default function UsersManager({
  users,
  groups,
  currentUserId,
}: {
  users: AdminUser[];
  groups: GroupOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [resetPassword, setResetPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setNotice(null);
  }

  function openEdit(user: AdminUser) {
    setMode("edit");
    setEditId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      groupId: user.group?.id ?? "",
      isActive: user.isActive,
    });
    setError(null);
    setNotice(null);
  }

  function openReset(user: AdminUser) {
    setMode("reset");
    setEditId(user.id);
    setResetPassword("");
    setError(null);
    setNotice(null);
  }

  function closeForm() {
    setMode(null);
    setEditId(null);
    setError(null);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  async function submitCreate() {
    const json = await send("/api/admin/users", "POST", {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      groupId: form.groupId || null,
    });
    if (!json) return;
    closeForm();
    setNotice("Foydalanuvchi yaratildi");
    router.refresh();
  }

  async function submitEdit() {
    if (!editId) return;
    const json = await send(`/api/admin/users/${editId}`, "PATCH", {
      name: form.name,
      role: form.role,
      groupId: form.groupId || null,
      isActive: form.isActive,
    });
    if (!json) return;
    closeForm();
    setNotice("Foydalanuvchi yangilandi");
    router.refresh();
  }

  async function submitReset() {
    if (!editId) return;
    const json = await send(`/api/admin/users/${editId}`, "PATCH", { password: resetPassword });
    if (!json) return;
    closeForm();
    setResetPassword("");
    setNotice("Parol yangilandi");
    router.refresh();
  }

  async function remove(user: AdminUser) {
    if (!window.confirm(`${user.name} o'chirilsinmi?`)) return;
    const json = await send(`/api/admin/users/${user.id}`, "DELETE");
    if (!json) return;
    setNotice("Foydalanuvchi o'chirildi");
    router.refresh();
  }

  const editedUser = editId ? users.find((u) => u.id === editId) : undefined;
  const isSelfEdit = Boolean(editedUser && editedUser.id === currentUserId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate}>+ Yangi foydalanuvchi</Button>
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
      </div>

      {mode ? (
        <Card className="border-brand-200/70">
          <CardHeader
            title={
              mode === "create"
                ? "Yangi foydalanuvchi"
                : mode === "edit"
                  ? "Foydalanuvchini tahrirlash"
                  : "Parolni tiklash"
            }
            subtitle={mode === "reset" ? editedUser?.name : undefined}
            action={
              <Button variant="ghost" size="sm" onClick={closeForm}>
                Yopish
              </Button>
            }
          />
          <CardBody>
            {mode === "reset" ? (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitReset();
                }}
              >
                <div>
                  <Label>Yangi parol</Label>
                  <Input
                    type="password"
                    minLength={6}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Kamida 6 belgi"
                  />
                </div>
                <div className="flex items-end sm:col-span-2">
                  <Button type="submit" disabled={busy || resetPassword.length < 6}>
                    {busy ? "Saqlanmoqda..." : "Parolni yangilash"}
                  </Button>
                </div>
                {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
              </form>
            ) : (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (mode === "create") submitCreate();
                  else submitEdit();
                }}
              >
                <div>
                  <Label>Ism</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="To'liq ism"
                    required
                  />
                </div>
                {mode === "create" ? (
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="user@ttpu.uz"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Email</Label>
                    <p className="py-2 text-sm text-slate-600">{editedUser?.email}</p>
                  </div>
                )}
                {mode === "create" ? (
                  <div>
                    <Label>Parol</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Kamida 6 belgi"
                      minLength={6}
                      required
                    />
                  </div>
                ) : null}
                <div>
                  <Label>Rol</Label>
                  <Select
                    value={form.role}
                    disabled={isSelfEdit}
                    onChange={(e) => update("role", e.target.value as Role)}
                  >
                    <option value="STUDENT">Talaba</option>
                    <option value="TEACHER">O&apos;qituvchi</option>
                    <option value="ADMIN">Administrator</option>
                  </Select>
                </div>
                <div>
                  <Label>Guruh</Label>
                  <Select value={form.groupId} onChange={(e) => update("groupId", e.target.value)}>
                    <option value="">Guruhsiz</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {mode === "edit" ? (
                  <label className="flex items-center gap-2 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300"
                      checked={form.isActive}
                      disabled={isSelfEdit}
                      onChange={(e) => update("isActive", e.target.checked)}
                    />
                    Faol
                  </label>
                ) : null}
                <div className="flex items-end sm:col-span-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? "Saqlanmoqda..." : mode === "create" ? "Yaratish" : "Saqlash"}
                  </Button>
                </div>
                {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
              </form>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Foydalanuvchilar" subtitle={`${users.length} ta`} />
        {users.length === 0 ? (
          <CardBody>
            <EmptyState title="Foydalanuvchilar topilmadi" description="Qidiruv shartlarini o'zgartirib ko'ring." />
          </CardBody>
        ) : (
          <Table className="max-h-[68vh] overflow-y-auto">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Foydalanuvchi</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Rol</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Guruh</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Holat</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Ro&apos;yxatdan o&apos;tgan</th>
                <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 text-right font-semibold backdrop-blur">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} className="size-9 text-[11px] ring-1 ring-slate-900/10" />
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">{user.name}</span>
                        <span className="block truncate text-xs text-slate-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={ROLE_META[user.role].tone}
                      className={cn("gap-1.5 ring-1 ring-inset", ROLE_META[user.role].ring)}
                    >
                      <span className={cn("size-1.5 rounded-full", ROLE_META[user.role].dot)} />
                      {ROLE_META[user.role].label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{user.group?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={user.isActive ? "green" : "rose"}>{user.isActive ? "Faol" : "Nofaol"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        Tahrirlash
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openReset(user)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="10" width="16" height="10" rx="2" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                        Parol
                      </Button>
                      {user.id !== currentUserId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => remove(user)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                          O&apos;chirish
                        </Button>
                      ) : null}
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
