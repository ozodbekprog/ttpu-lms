"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/components/quiz/api";
import {
  QUESTION_TYPE_LABEL,
  QUESTION_TYPE_SOFT,
  QUESTION_TYPE_TONE,
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const answersRef = useRef<QuizAnswers>({});
  const submittedRef = useRef(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number((entry.target as HTMLElement).dataset.index))
          .filter((value) => Number.isInteger(value))
          .sort((a, b) => a - b);
        if (visible.length > 0) setActiveIndex(visible[0]);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    for (const element of sectionRefs.current) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [questions]);

  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

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

  function goTo(index: number) {
    const element = sectionRefs.current[index];
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const unanswered = questions.length - answeredCount;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const critical = remaining !== null && remaining <= 60;
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
      <header className="sticky top-16 z-30 mb-6 rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3.5 shadow-card backdrop-blur md:top-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-brand-900">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {answeredCount}/{questions.length} savol belgilandi
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex flex-1 items-center gap-1">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Savol ${index + 1}`}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-300",
                      index === activeIndex
                        ? "bg-brand-700"
                        : answers[question.id] !== undefined
                          ? "bg-brand-400"
                          : "bg-slate-200 hover:bg-slate-300",
                    )}
                  />
                ))}
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                Savol {Math.min(activeIndex + 1, questions.length)}/{questions.length}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-2xl px-3 py-1.5 text-right transition-colors duration-300",
              critical ? "bg-rose-50 ring-1 ring-rose-200" : "ring-1 ring-transparent",
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Qolgan vaqt
            </p>
            {remaining !== null ? (
              <p
                className={cn(
                  "font-mono text-3xl font-semibold tabular-nums sm:text-4xl",
                  timerTone,
                  critical && "animate-pulse",
                )}
              >
                {formatClock(remaining)}
              </p>
            ) : (
              <p className="py-1 text-sm text-slate-400">Cheklovsiz</p>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-5">
        {questions.map((question, index) => (
          <section
            key={question.id}
            ref={(element) => {
              sectionRefs.current[index] = element;
            }}
            data-index={index}
            className="scroll-mt-32 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-xl text-sm font-bold",
                    QUESTION_TYPE_SOFT[question.type],
                  )}
                >
                  {index + 1}
                </span>
                <Badge tone={QUESTION_TYPE_TONE[question.type]}>
                  {QUESTION_TYPE_LABEL[question.type]}
                </Badge>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-300/25 px-2.5 py-1 text-xs font-semibold text-gold-600">
                {question.points} ball
              </span>
            </div>
            <p className="mt-3.5 text-base font-medium leading-relaxed text-slate-900">
              {question.text}
            </p>

            {question.type === "SINGLE" || question.type === "MULTIPLE" ? (
              <div className="mt-4 space-y-2.5">
                {question.options.map((option, optionIndex) => {
                  const selected =
                    question.type === "SINGLE"
                      ? answers[question.id] === optionIndex
                      : isChecked(question.id, optionIndex);
                  return (
                    <label
                      key={optionIndex}
                      className={cn(
                        "flex cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-base transition-all duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500/30 sm:px-5 sm:py-4",
                        selected
                          ? "border-brand-500 bg-brand-50/70 font-medium text-brand-950 shadow-sm"
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
                          "inline-flex size-6 shrink-0 items-center justify-center border transition-colors duration-150",
                          question.type === "SINGLE" ? "rounded-full" : "rounded-lg",
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {selected ? <CheckIcon /> : null}
                      </span>
                      <span className="flex-1">{option}</span>
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
        <div className="mb-2 flex items-center gap-3 px-1">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress === 100 ? "bg-emerald-500" : "bg-brand-600",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">{progress}%</span>
        </div>
        <p className="mb-2 px-1 text-xs text-slate-500">
          {unanswered > 0 ? `Javob berilmagan savollar: ${unanswered} ta` : "Barcha savollarga javob belgilandi"}
        </p>
        <Button
          size="lg"
          className="w-full py-3 text-base!"
          onClick={() => setConfirmOpen(true)}
          disabled={submitting}
        >
          {submitting ? "Topshirilmoqda..." : "Topshirish"}
        </Button>
      </div>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Topshirishni tasdiqlash"
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md animate-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-lift">
            <div className="flex items-start gap-3.5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold tracking-tight text-slate-900">
                  Testni topshirasizmi?
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {answeredCount}/{questions.length} savol belgilangan.
                  {unanswered > 0
                    ? ` ${unanswered} ta savol javobsiz qoladi.`
                    : " Barcha savollar belgilangan."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Bekor qilish
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  void submit();
                }}
                disabled={submitting}
              >
                {submitting ? "Topshirilmoqda..." : "Ha, topshirish"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
