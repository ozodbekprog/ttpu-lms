"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";

export function AssignmentsCreate({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/courses/${courseId}/assignments`, {
      method: "POST",
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

    setTitle("");
    setDescription("");
    setDueAt("");
    setMaxScore("100");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>Yangi topshiriq</Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader title="Yangi topshiriq" subtitle="Shartlarni to'ldirib e'lon qiling" />
      <CardBody>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Sarlavha</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
                placeholder="Masalan: Amaliy topshiriq 2"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Tavsif</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Topshiriq sharti..."
              />
            </div>
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
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
