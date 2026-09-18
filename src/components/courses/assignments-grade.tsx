"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Input, Label, Table, Textarea } from "@/components/ui";
import { SubmissionBadge, type SubmissionStatusValue } from "@/components/courses/assignments-status";
import { cn, fmtDateTime } from "@/lib/utils";

export type SubmissionRow = {
  id: string;
  studentName: string;
  studentAvatar: string | null;
  submittedAt: string;
  status: SubmissionStatusValue;
  score: number | null;
  feedback: string | null;
  text: string | null;
  fileUrl: string | null;
};

function fileNameOf(url: string) {
  const last = url.split("?")[0]?.split("/").pop();
  return last && last.length > 0 ? last : url;
}

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
  const gradedCount = submissions.filter((item) => item.status === "GRADED").length;

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
      <CardHeader
        title="Topshirilgan ishlar"
        subtitle={`${submissions.length} ta topshiriq · ${gradedCount} ta baholangan`}
        action={
          submissions.length > 0 ? (
            <Badge tone={gradedCount === submissions.length ? "green" : "amber"}>
              {gradedCount}/{submissions.length}
            </Badge>
          ) : null
        }
      />
      <CardBody>
        <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0">
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-10 text-center">
                <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <p className="font-medium text-slate-700">Hali hech kim topshirmagan</p>
                <p className="text-sm text-slate-500">Talabalar ish yuklagach shu yerda paydo bo&apos;ladi.</p>
              </div>
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="rounded-l-xl py-2.5 pr-3 pl-3 text-left font-medium">Talaba</th>
                    <th className="px-3 py-2.5 text-left font-medium">Sana</th>
                    <th className="px-3 py-2.5 text-left font-medium">Holat</th>
                    <th className="px-3 py-2.5 text-left font-medium">Fayl</th>
                    <th className="px-3 py-2.5 text-left font-medium">Ball</th>
                    <th className="rounded-r-xl px-3 py-2.5" />
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
                      <td className="py-3 pr-3 pl-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={submission.studentName} src={submission.studentAvatar} size={32} />
                          <span className="text-sm font-medium text-slate-800">
                            {submission.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-500">
                        {fmtDateTime(submission.submittedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <SubmissionBadge status={submission.status} />
                      </td>
                      <td className="px-3 py-3">
                        {submission.fileUrl ? (
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={fileNameOf(submission.fileUrl)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                          >
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
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                              <path d="M14 2v6h6" />
                              <path d="M12 18v-6" />
                              <path d="m9 15 3 3 3-3" />
                            </svg>
                            Yuklab olish
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-700">
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
          </div>

          <div className="lg:sticky lg:top-6">
            {selected ? (
              <form
                onSubmit={handleSubmit}
                className="animate-fade-up overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_30px_-18px_rgba(29,52,96,0.28)]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-brand-100/70 bg-gradient-to-r from-brand-50 to-white px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={selected.studentName} src={selected.studentAvatar} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selected.studentName}
                      </p>
                      <p className="text-xs text-slate-500">{fmtDateTime(selected.submittedAt)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                    aria-label="Panelni yopish"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <SubmissionBadge status={selected.status} />
                    {selected.score != null ? (
                      <Badge tone="blue">
                        {selected.score}/{maxScore} ball
                      </Badge>
                    ) : null}
                  </div>

                  {selected.text ? (
                    <div className="rounded-xl border-l-[3px] border-brand-300 bg-slate-50 px-3.5 py-3">
                      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                        Javob matni
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                        {selected.text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Javob matni kiritilmagan.</p>
                  )}

                  {selected.fileUrl ? (
                    <a
                      href={selected.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/60"
                    >
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-slate-200">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                        {fileNameOf(selected.fileUrl)}
                      </span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-slate-400"
                      >
                        <path d="M12 3v12" />
                        <path d="m7 10 5 5 5-5" />
                        <path d="M5 21h14" />
                      </svg>
                    </a>
                  ) : null}

                  <div className="grid gap-4">
                    <div>
                      <Label>Ball (0-{maxScore})</Label>
                      <Input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={score}
                        onChange={(event) => setScore(event.target.value)}
                        required
                        className="text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <Label>Izoh</Label>
                      <Textarea
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        rows={4}
                        placeholder="Talabaga izoh yozing..."
                        className="resize-y leading-relaxed"
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>
                  ) : null}

                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setSelectedId(null)}>
                      Yopish
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saqlanmoqda..." : "Baholash"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-10 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-white text-brand-600 ring-1 ring-slate-200">
                  <svg
                    width="17"
                    height="17"
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
                </span>
                <p className="font-medium text-slate-700">Baholash paneli</p>
                <p className="max-w-56 text-sm text-slate-500">
                  Jadvaldan talabani tanlang — baho va izoh shu yerda kiritiladi.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
