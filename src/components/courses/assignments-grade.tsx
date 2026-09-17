"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Table, Textarea } from "@/components/ui";
import { SubmissionBadge, type SubmissionStatusValue } from "@/components/courses/assignments-status";
import { fmtDateTime } from "@/lib/utils";

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
    <Card>
      <CardHeader title="Topshirilgan ishlar" subtitle={`${submissions.length} ta`} />
      <CardBody className="space-y-4">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-500">Hali hech kim topshirmagan.</p>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pr-3 text-left font-medium">Talaba</th>
                <th className="px-3 py-2 text-left font-medium">Sana</th>
                <th className="px-3 py-2 text-left font-medium">Holat</th>
                <th className="px-3 py-2 text-left font-medium">Ball</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={selectedId === submission.id ? "bg-blue-50/60" : undefined}
                >
                  <td className="py-2 pr-3 text-sm font-medium text-slate-800">
                    {submission.studentName}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {fmtDateTime(submission.submittedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <SubmissionBadge status={submission.status} />
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {submission.score != null ? `${submission.score}/${maxScore}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
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
          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">{selected.studentName}</p>
            {selected.text ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{selected.text}</p>
            ) : null}
            {selected.fileUrl ? (
              <a
                href={selected.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-sm text-blue-600 hover:underline"
              >
                {selected.fileUrl}
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
            <div className="mt-3 flex justify-end gap-2">
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
