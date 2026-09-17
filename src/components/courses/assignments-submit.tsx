"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function AssignmentsSubmit({
  assignmentId,
  overdue,
  existing,
}: {
  assignmentId: string;
  overdue: boolean;
  existing: { text: string | null; fileUrl: string | null } | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(existing?.text ?? "");
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);

    const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text || null, fileUrl: fileUrl || null }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    setSaving(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Topshirishda xatolik yuz berdi");
      return;
    }

    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {overdue ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Muddat o&apos;tgan. Topshirilgan ish &quot;Kechikkan&quot; (LATE) holatida qayd etiladi.
        </p>
      ) : null}
      <div>
        <Label>Javob matni</Label>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder="Javobingizni yozing..."
        />
      </div>
      <div>
        <Label>Fayl havolasi (ixtiyoriy)</Label>
        <Input
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          maxLength={500}
          placeholder="https://... yoki /uploads/fayl.pdf"
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {done ? <p className="text-sm text-emerald-600">Topshiriq yuborildi</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Yuborilmoqda..." : existing ? "Qayta topshirish" : "Topshirish"}
        </Button>
      </div>
    </form>
  );
}
