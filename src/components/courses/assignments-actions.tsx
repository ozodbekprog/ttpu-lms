"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";

export type AssignmentData = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  maxScore: number;
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AssignmentsActions({ assignment }: { assignment: AssignmentData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description ?? "");
  const [dueAt, setDueAt] = useState(toLocalInput(assignment.dueAt));
  const [maxScore, setMaxScore] = useState(String(assignment.maxScore));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        dueAt: dueAt || null,
        maxScore: Number(maxScore),
      }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    setSaving(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Saqlashda xatolik yuz berdi");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Topshiriqni o'chirishni tasdiqlaysizmi?")) return;
    setDeleting(true);
    await fetch(`/api/assignments/${assignment.id}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="secondary" onClick={() => setEditing((value) => !value)}>
          Tahrirlash
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
          O&apos;chirish
        </Button>
      </div>
      {editing ? (
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="grid gap-4">
            <div>
              <Label>Sarlavha</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Muddat</Label>
                <Input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </div>
              <div>
                <Label>Maksimal ball</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={maxScore}
                  onChange={(event) => setMaxScore(event.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Bekor qilish
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      ) : null}
    </>
  );
}
