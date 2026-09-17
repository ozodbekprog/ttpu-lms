"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";

export function ForumTopicCreate({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/courses/${courseId}/forum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
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
    setBody("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>Yangi mavzu</Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader title="Yangi mavzu" subtitle="Savol yoki muhokama mavzusini boshlang" />
      <CardBody>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>Sarlavha</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
                placeholder="Masalan: 2-topshiriq bo'yicha savol"
              />
            </div>
            <div>
              <Label>Matn</Label>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={4}
                maxLength={10000}
                required
                placeholder="Savolingizni batafsil yozing..."
              />
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Yuborish"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
