"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
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
import { fmtDate } from "@/lib/utils";

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

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "Talaba",
};

const ROLE_TONE: Record<Role, "purple" | "blue" | "slate"> = {
  ADMIN: "purple",
  TEACHER: "blue",
  STUDENT: "slate",
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
        {notice ? <span className="text-sm text-emerald-600">{notice}</span> : null}
        {error && !mode ? <span className="text-sm text-rose-600">{error}</span> : null}
      </div>

      {mode ? (
        <Card>
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
                    <option value="TEACHER">O'qituvchi</option>
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
          <Table>
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Ism</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Guruh</th>
                <th className="px-5 py-3 font-medium">Holat</th>
                <th className="px-5 py-3 font-medium">Ro'yxatdan o'tgan</th>
                <th className="px-5 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-900">{user.name}</span>
                    <span className="block text-xs text-slate-500">{user.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{user.group?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={user.isActive ? "green" : "rose"}>{user.isActive ? "Faol" : "Nofaol"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{fmtDate(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>
                        Tahrirlash
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openReset(user)}>
                        Parol
                      </Button>
                      {user.id !== currentUserId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => remove(user)}
                        >
                          O'chirish
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
