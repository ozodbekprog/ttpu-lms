"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, Textarea } from "@/components/ui";
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

export function AttemptForm({
  attemptId,
  quizId,
  questions,
  endsAt,
}: {
  attemptId: string;
  quizId: string;
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

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Javob berildi:</span>
            <Badge tone="blue">
              {answeredCount}/{questions.length}
            </Badge>
          </div>
          {remaining !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Qolgan vaqt:</span>
              <span
                className={
                  remaining <= 60
                    ? "font-mono text-lg font-semibold text-rose-600"
                    : "font-mono text-lg font-semibold text-slate-900"
                }
              >
                {formatClock(remaining)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">Vaqt chegarasi yo&apos;q</span>
          )}
        </CardBody>
      </Card>

      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader
            title={`${index + 1}. ${question.text}`}
            subtitle={`${QUESTION_TYPE_LABEL[question.type]} · ${question.points} ball`}
          />
          <CardBody className="space-y-2">
            {question.type === "SINGLE" ? (
              question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={answers[question.id] === optionIndex}
                    onChange={() => setValue(question.id, optionIndex)}
                    className="size-4 accent-blue-600"
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))
            ) : null}

            {question.type === "MULTIPLE" ? (
              question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={isChecked(question.id, optionIndex)}
                    onChange={() => toggleMultiple(question.id, optionIndex)}
                    className="size-4 accent-blue-600"
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))
            ) : null}

            {question.type === "TEXT" ? (
              <Textarea
                rows={4}
                placeholder="Javobingizni yozing..."
                value={textValue(question.id)}
                onChange={(event) => setValue(question.id, event.target.value)}
              />
            ) : null}
          </CardBody>
        </Card>
      ))}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <Button onClick={() => void submit()} disabled={submitting}>
          {submitting ? "Topshirilmoqda..." : "Topshirish"}
        </Button>
      </div>
    </div>
  );
}
