"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

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

function PencilIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
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
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 transition-opacity duration-150",
          editing
            ? "opacity-100"
            : "md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100",
        )}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing((value) => !value)}
          aria-label="Tahrirlash"
        >
          <PencilIcon />
          Tahrirlash
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="O'chirish"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <TrashIcon />
          O&apos;chirish
        </button>
      </div>
      {editing ? (
        <form
          onSubmit={handleSubmit}
          className="animate-fade-up mt-1 w-full rounded-2xl border border-brand-100 bg-brand-50/30 p-4 ring-1 ring-brand-50"
        >
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="inline-flex size-6 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-brand-100">
              <PencilIcon />
            </span>
            Topshiriqni tahrirlash
          </p>
          <div className="grid gap-4">
            <div>
              <Label>Sarlavha</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
                className="bg-white"
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="bg-white"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Muddat</Label>
                <Input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                  className="bg-white"
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
                  className="bg-white"
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
