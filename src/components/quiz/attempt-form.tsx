"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/components/quiz/api";
import {
  QUESTION_TYPE_LABEL,
  type AnswerValue,
  type QuestionPublic,
  type QuizAnswers,
} from "@/components/quiz/shared";

function formatClock(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function AttemptForm({
  attemptId,
  quizId,
  title,
  questions,
  endsAt,
}: {
  attemptId: string;
  quizId: string;
  title: string;
  questions: QuestionPublic[];
  endsAt: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef<QuizAnswers>({});
  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    const result = await apiFetch(`/api/attempts/${attemptId}`, "PATCH", {
      answers: answersRef.current,
    });
    if (!result.ok) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(result.error);
      return;
    }
    router.push(`/quizzes/${quizId}/results`);
  }, [attemptId, quizId, router]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const remaining = endsAt
    ? Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000))
    : null;

  useEffect(() => {
    if (remaining === 0) void submit();
  }, [remaining, submit]);

  function setValue(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMultiple(questionId: string, index: number) {
    const current = answers[questionId];
    const selected = Array.isArray(current) ? current : [];
    const next = selected.includes(index)
      ? selected.filter((item) => item !== index)
      : [...selected, index].sort((a, b) => a - b);
    setValue(questionId, next);
  }

  function isChecked(questionId: string, index: number): boolean {
    const current = answers[questionId];
    return Array.isArray(current) && current.includes(index);
  }

  function textValue(questionId: string): string {
    const current = answers[questionId];
    return typeof current === "string" ? current : "";
  }

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const unanswered = questions.length - answeredCount;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const timerTone =
    remaining === null
      ? "text-slate-400"
      : remaining <= 60
        ? "text-rose-600"
        : remaining <= 300
          ? "text-amber-600"
          : "text-brand-900";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="sticky top-16 z-30 mb-6 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3 shadow-card backdrop-blur md:top-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-brand-900">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {answeredCount}/{questions.length} savol belgilandi
            </p>
            <div className="mt-2 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-700 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Qolgan vaqt
            </p>
            {remaining !== null ? (
              <p className={cn("font-mono text-2xl font-semibold tabular-nums", timerTone)}>
                {formatClock(remaining)}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Cheklovsiz</p>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-5">
        {questions.map((question, index) => (
          <section
            key={question.id}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-800">
                {index + 1}
              </span>
              <span className="text-xs text-slate-400">
                {QUESTION_TYPE_LABEL[question.type]} · {question.points} ball
              </span>
            </div>
            <p className="mt-3 text-base font-medium leading-relaxed text-slate-900">
              {question.text}
            </p>

            {question.type === "SINGLE" || question.type === "MULTIPLE" ? (
              <div className="mt-4 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const selected =
                    question.type === "SINGLE"
                      ? answers[question.id] === optionIndex
                      : isChecked(question.id, optionIndex);
                  return (
                    <label
                      key={optionIndex}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500/30",
                        selected
                          ? "border-brand-500 bg-brand-50/70 font-medium text-brand-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type={question.type === "SINGLE" ? "radio" : "checkbox"}
                        name={`question-${question.id}`}
                        checked={selected}
                        onChange={() =>
                          question.type === "SINGLE"
                            ? setValue(question.id, optionIndex)
                            : toggleMultiple(question.id, optionIndex)
                        }
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "inline-flex size-5 shrink-0 items-center justify-center border transition-colors duration-150",
                          question.type === "SINGLE" ? "rounded-full" : "rounded-md",
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {selected ? <CheckIcon /> : null}
                      </span>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <Textarea
                rows={5}
                placeholder="Javobingizni yozing..."
                value={textValue(question.id)}
                onChange={(event) => setValue(question.id, event.target.value)}
                className="mt-4"
              />
            )}
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 z-20 mt-6 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-lift backdrop-blur">
        {error ? <p className="mb-2 px-1 text-sm text-rose-600">{error}</p> : null}
        {unanswered > 0 ? (
          <p className="mb-2 px-1 text-xs text-slate-500">
            Javob berilmagan savollar: {unanswered} ta
          </p>
        ) : null}
        <Button
          size="lg"
          className="w-full py-3 text-base!"
          onClick={() => void submit()}
          disabled={submitting}
        >
          {submitting ? "Topshirilmoqda..." : "Topshirish"}
        </Button>
      </div>
    </div>
  );
}
