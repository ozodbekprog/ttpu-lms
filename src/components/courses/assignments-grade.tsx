"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Table, Textarea } from "@/components/ui";
import { SubmissionBadge, type SubmissionStatusValue } from "@/components/courses/assignments-status";
import { cn, fmtDateTime } from "@/lib/utils";

export type SubmissionRow = {
  id: string;
  studentName: string;
  submittedAt: string;
  status: SubmissionStatusValue;
  score: number | null;
  feedback: string | null;
  text: string | null;
  fileUrl: string | null;
};

export function AssignmentsGrade({
  maxScore,
  submissions,
}: {
  maxScore: number;
  submissions: SubmissionRow[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = submissions.find((item) => item.id === selectedId) ?? null;

  function select(submission: SubmissionRow) {
    setSelectedId(submission.id);
    setScore(submission.score != null ? String(submission.score) : "");
    setFeedback(submission.feedback ?? "");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/submissions/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(score), feedback: feedback || null }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;

    setSaving(false);
    if (!response.ok || !json?.ok) {
      setError(json?.error ?? "Baholashda xatolik yuz berdi");
      return;
    }

    setSelectedId(null);
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Topshirilgan ishlar" subtitle={`${submissions.length} ta`} />
      <CardBody className="space-y-4">
        {submissions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
            Hali hech kim topshirmagan.
          </p>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-3 text-left font-medium">Talaba</th>
                <th className="px-3 py-2.5 text-left font-medium">Sana</th>
                <th className="px-3 py-2.5 text-left font-medium">Holat</th>
                <th className="px-3 py-2.5 text-left font-medium">Fayl</th>
                <th className="px-3 py-2.5 text-left font-medium">Ball</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={cn(
                    "transition-colors duration-150",
                    selectedId === submission.id ? "bg-brand-50/60" : "hover:bg-slate-50/70",
                  )}
                >
                  <td className="py-3 pr-3 text-sm font-medium text-slate-800">
                    {submission.studentName}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {fmtDateTime(submission.submittedAt)}
                  </td>
                  <td className="px-3 py-3">
                    <SubmissionBadge status={submission.status} />
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {submission.fileUrl ? (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                      >
                        Yuklab olish
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {submission.score != null ? (
                      <span className="font-semibold text-slate-800">{submission.score}</span>
                    ) : (
                      "—"
                    )}
                    <span className="text-slate-400">/{maxScore}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => select(submission)}>
                      Baholash
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {selected ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">{selected.studentName}</p>
              <SubmissionBadge status={selected.status} />
            </div>
            {selected.text ? (
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-600">
                {selected.text}
              </p>
            ) : null}
            {selected.fileUrl ? (
              <a
                href={selected.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm text-brand-700 hover:underline"
              >
                <span className="truncate">{selected.fileUrl}</span>
              </a>
            ) : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
              <div>
                <Label>Ball (0-{maxScore})</Label>
                <Input
                  type="number"
                  min={0}
                  max={maxScore}
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Izoh</Label>
                <Textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={2}
                  placeholder="Talabaga izoh..."
                />
              </div>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Yopish
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Baholash"}
              </Button>
            </div>
          </form>
        ) : null}
      </CardBody>
    </Card>
  );
}
