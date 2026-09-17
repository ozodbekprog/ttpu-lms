"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/components/quiz/api";
import {
  QUESTION_TYPE_LABEL,
  type QuestionDraft,
  type QuestionFull,
  type QuestionType,
} from "@/components/quiz/shared";
import { QuestionForm } from "@/components/quiz/question-form";

export type CourseOption = { id: string; title: string };

export type EditableQuiz = {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  dueAt?: string | null;
  timeLimitMin: number | null;
  maxAttempts: number;
  isPublished: boolean;
  questions: QuestionFull[];
};

const NEW_QUESTION_ID = "__new__";

const TYPE_TONE: Record<QuestionType, string> = {
  SINGLE: "brand",
  MULTIPLE: "purple",
  TEXT: "amber",
};

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function QuizEditor({ courses, quiz }: { courses: CourseOption[]; quiz?: EditableQuiz }) {
  const router = useRouter();
  const tempCounter = useRef(0);

  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [courseId, setCourseId] = useState(quiz?.courseId ?? courses[0]?.id ?? "");
  const [dueAt, setDueAt] = useState(toDateTimeLocal(quiz?.dueAt));
  const [timeLimitMin, setTimeLimitMin] = useState(
    quiz?.timeLimitMin != null ? String(quiz.timeLimitMin) : "",
  );
  const [maxAttempts, setMaxAttempts] = useState(String(quiz?.maxAttempts ?? 1));
  const [isPublished, setIsPublished] = useState(quiz?.isPublished ?? false);
  const [questions, setQuestions] = useState<QuestionFull[]>(quiz?.questions ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function metaData() {
    const time = timeLimitMin.trim();
    const base = {
      title: title.trim(),
      description: description.trim() === "" ? null : description.trim(),
      courseId,
      timeLimitMin: time === "" ? null : Number(time),
      maxAttempts: Number(maxAttempts),
      isPublished,
    };
    if (quiz && quiz.dueAt === undefined) return base;
    return { ...base, dueAt: dueAt.trim() === "" ? null : dueAt.trim() };
  }

  function validateMeta(): string | null {
    if (!title.trim()) return "Test nomini kiriting";
    if (!courseId) return "Kursni tanlang";
    const attempts = Number(maxAttempts);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 50) {
      return "Urinishlar soni 1 dan 50 gacha bo'lishi kerak";
    }
    const time = timeLimitMin.trim();
    if (time !== "") {
      const parsed = Number(time);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 600) {
        return "Vaqt chegarasi 1 dan 600 daqiqagacha bo'lishi kerak";
      }
    }
    return null;
  }

  async function saveMeta() {
    const problem = validateMeta();
    if (problem) {
      setError(problem);
      setMessage(null);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    if (quiz) {
      const result = await apiFetch(`/api/quizzes/${quiz.id}`, "PATCH", metaData());
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Saqlandi");
      router.refresh();
      return;
    }

    const result = await apiFetch<{ id: string }>("/api/quizzes", "POST", {
      ...metaData(),
      questions: questions.map((question) => ({
        text: question.text,
        type: question.type,
        options: question.options,
        correct: question.correct,
        points: question.points,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/quizzes/${result.data.id}`);
  }

  async function saveQuestion(draft: QuestionDraft): Promise<string | null> {
    const activeId = editingId;

    if (quiz && activeId === NEW_QUESTION_ID) {
      const result = await apiFetch<QuestionFull>(`/api/quizzes/${quiz.id}/questions`, "POST", draft);
      if (!result.ok) return result.error;
      setQuestions((prev) => [...prev, result.data]);
      setEditingId(null);
      return null;
    }

    if (quiz && activeId && !activeId.startsWith("tmp-")) {
      const result = await apiFetch<QuestionFull>(`/api/questions/${activeId}`, "PATCH", draft);
      if (!result.ok) return result.error;
      setQuestions((prev) => prev.map((question) => (question.id === activeId ? result.data : question)));
      setEditingId(null);
      return null;
    }

    if (activeId === NEW_QUESTION_ID) {
      tempCounter.current += 1;
      const local: QuestionFull = {
        id: `tmp-${tempCounter.current}`,
        ...draft,
        position: questions.length + 1,
      };
      setQuestions((prev) => [...prev, local]);
    } else if (activeId) {
      setQuestions((prev) =>
        prev.map((question) => (question.id === activeId ? { ...question, ...draft } : question)),
      );
    }
    setEditingId(null);
    return null;
  }

  async function deleteQuestion(question: QuestionFull) {
    if (!window.confirm("Savolni o'chirishni tasdiqlaysizmi?")) return;
    if (quiz && !question.id.startsWith("tmp-")) {
      const result = await apiFetch(`/api/questions/${question.id}`, "DELETE");
      if (!result.ok) {
        setError(result.error);
        return;
      }
    }
    setQuestions((prev) => prev.filter((item) => item.id !== question.id));
  }

  async function deleteQuiz() {
    if (!quiz) return;
    if (!window.confirm("Testni butunlay o'chirishni tasdiqlaysizmi?")) return;
    setSaving(true);
    const result = await apiFetch(`/api/quizzes/${quiz.id}`, "DELETE");
    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }
    router.push("/quizzes");
  }

  const editingQuestion = questions.find((question) => question.id === editingId) ?? undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Test ma'lumotlari"
          subtitle={quiz ? "Test nomi, kurs va cheklovlar" : "Test yaratish va savollar qo'shish"}
        />
        <CardBody className="space-y-4">
          <div>
            <Label>Nom</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: Test 1: Asosiy tushunchalar"
            />
          </div>
          <div>
            <Label>Tavsif</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Qisqacha tavsif"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label>Kurs</Label>
              <Select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                disabled={courses.length === 0}
              >
                {courses.length === 0 ? <option value="">Kurslar yo&apos;q</option> : null}
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Muddat (deadline)</Label>
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
            <div>
              <Label>Vaqt (daqiqa)</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={timeLimitMin}
                onChange={(event) => setTimeLimitMin(event.target.value)}
                placeholder="Cheklovsiz"
              />
            </div>
            <div>
              <Label>Urinishlar soni</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxAttempts}
                onChange={(event) => setMaxAttempts(event.target.value)}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 transition-colors duration-150 hover:border-slate-300">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800">
                Talabalarga e&apos;lon qilish
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                E&apos;lon qilinmagan test faqat sizga ko&apos;rinadi
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="size-4 shrink-0 accent-brand-700"
            />
          </label>
        </CardBody>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Savollar <span className="text-sm font-normal text-slate-500">({questions.length} ta)</span>
          </h2>
          <Button
            variant="secondary"
            onClick={() => setEditingId(NEW_QUESTION_ID)}
            disabled={editingId !== null}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Savol qo&apos;shish
          </Button>
        </div>

        <div className="space-y-3">
          {questions.length === 0 && editingId !== NEW_QUESTION_ID ? (
            <EmptyState
              title="Savollar yo'q"
              description="Testga kamida bitta savol qo'shing."
            />
          ) : null}

          {questions.map((question) =>
            editingId === question.id ? (
              <QuestionForm
                key={question.id}
                initial={question}
                onSubmit={saveQuestion}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card
                key={question.id}
                className="transition-shadow duration-150 hover:shadow-lift"
              >
                <CardBody className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-800">
                        {question.position}
                      </span>
                      <Badge tone={TYPE_TONE[question.type]}>
                        {QUESTION_TYPE_LABEL[question.type]}
                      </Badge>
                      <Badge tone="gold">{question.points} ball</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{question.text}</p>
                    {question.type !== "TEXT" ? (
                      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                        {question.options.map((option, index) => {
                          const isCorrect = question.correct.includes(index);
                          return (
                            <li
                              key={index}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
                                isCorrect
                                  ? "bg-emerald-50 font-medium text-emerald-800"
                                  : "text-slate-500",
                              )}
                            >
                              {isCorrect ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              ) : (
                                <span className="inline-block size-1.5 shrink-0 rounded-full bg-slate-300" />
                              )}
                              <span className="truncate">{option}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        Matnli savol — javob o&apos;qituvchi tomonidan qo&apos;lda baholanadi.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingId(question.id)}
                      disabled={editingId !== null}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400! hover:bg-rose-50! hover:text-rose-600!"
                      onClick={() => void deleteQuestion(question)}
                      disabled={editingId !== null}
                    >
                      O&apos;chirish
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ),
          )}

          {editingId === NEW_QUESTION_ID && editingQuestion === undefined ? (
            <QuestionForm onSubmit={saveQuestion} onCancel={() => setEditingId(null)} />
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-4 z-20">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-lift backdrop-blur">
          <div className="min-w-0 text-sm">
            {error ? (
              <p className="text-rose-600">{error}</p>
            ) : message ? (
              <p className="text-emerald-600">{message}</p>
            ) : (
              <p className="text-slate-500">
                {quiz
                  ? "O'zgarishlarni saqlashni unutmang"
                  : questions.length > 0
                    ? `${questions.length} ta savol tayyor`
                    : "Savollarni qo'shib, testni yaratishni yakunlang"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {quiz ? (
              <Button variant="danger" size="sm" onClick={() => void deleteQuiz()} disabled={saving}>
                Testni o&apos;chirish
              </Button>
            ) : null}
            <Button onClick={() => void saveMeta()} disabled={saving || courses.length === 0}>
              {saving ? "Saqlanmoqda..." : quiz ? "Saqlash" : "Testni yaratish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
