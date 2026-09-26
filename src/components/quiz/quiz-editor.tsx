"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/components/quiz/api";
import {
  QUESTION_TYPE_ACCENT,
  QUESTION_TYPE_ICON,
  QUESTION_TYPE_LABEL,
  QUESTION_TYPE_SOFT,
  QUESTION_TYPE_TONE,
  type QuestionDraft,
  type QuestionFull,
} from "@/components/quiz/shared";
import { QuestionForm } from "@/components/quiz/question-form";
import { BankImportModal } from "@/components/question-bank/import-modal";
import type { BankQuestionItem } from "@/components/question-bank/shared";

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

function letterOf(index: number): string {
  return String.fromCharCode(65 + index);
}

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
  const [bankOpen, setBankOpen] = useState(false);
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

  async function importBankQuestions(items: BankQuestionItem[]): Promise<string | null> {
    const drafts: QuestionDraft[] = items.map((item) => ({
      text: item.text,
      type: item.type,
      options: item.options,
      correct: item.correct,
      points: 1,
    }));

    if (quiz) {
      const created: QuestionFull[] = [];
      for (const draft of drafts) {
        const result = await apiFetch<QuestionFull>(`/api/quizzes/${quiz.id}/questions`, "POST", draft);
        if (!result.ok) return result.error;
        created.push(result.data);
      }
      setQuestions((prev) => [...prev, ...created]);
      setError(null);
      setMessage(`${created.length} ta savol bankdan qo'shildi`);
      return null;
    }

    const base = questions.length;
    const locals: QuestionFull[] = drafts.map((draft, index) => {
      tempCounter.current += 1;
      return { id: `tmp-${tempCounter.current}`, ...draft, position: base + index + 1 };
    });
    setQuestions((prev) => [...prev, ...locals]);
    setError(null);
    setMessage(`${locals.length} ta savol bankdan qo'shildi`);
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
  const questionsTotal = questions.reduce((sum, question) => sum + question.points, 0);

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
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Savollar</h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {questions.length} ta
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-300/25 px-3 py-1 text-xs font-semibold text-gold-800">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.35 6.2 20.4l1.1-6.45-4.7-4.6 6.5-.95L12 2.5z" />
              </svg>
              {questionsTotal} ball
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setBankOpen(true)}
              disabled={editingId !== null || courses.length === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Bankdan qo&apos;shish
            </Button>
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
                className="group relative overflow-hidden transition-all duration-150 hover:shadow-lift"
              >
                <span className={cn("absolute inset-y-0 left-0 w-1", QUESTION_TYPE_ACCENT[question.type])} />
                <CardBody className="flex flex-wrap items-start justify-between gap-4 pl-7">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                          QUESTION_TYPE_SOFT[question.type],
                        )}
                      >
                        {question.position}
                      </span>
                      <Badge tone={QUESTION_TYPE_TONE[question.type]} className="gap-1.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d={QUESTION_TYPE_ICON[question.type]} />
                        </svg>
                        {QUESTION_TYPE_LABEL[question.type]}
                      </Badge>
                      <Badge tone="gold">{question.points} ball</Badge>
                    </div>
                    <p className="mt-2.5 text-sm font-medium text-slate-900">{question.text}</p>
                    {question.type !== "TEXT" ? (
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, index) => {
                          const isCorrect = question.correct.includes(index);
                          return (
                            <li
                              key={index}
                              className={cn(
                                "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-colors duration-150",
                                isCorrect
                                  ? "border-emerald-300 bg-emerald-50/80 font-medium text-emerald-900 ring-2 ring-emerald-400/30"
                                  : "border-slate-200 bg-white text-slate-600",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                                  isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {isCorrect ? (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                  </svg>
                                ) : (
                                  letterOf(index)
                                )}
                              </span>
                              <span className="truncate">{option}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 8v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                        </svg>
                        Matnli javob qo&apos;lda baholanadi
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
                      className="text-slate-600! hover:bg-rose-50! hover:text-rose-600!"
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-lift backdrop-blur">
          <span
            className={cn(
              "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r",
              error
                ? "from-rose-300 via-rose-500 to-rose-300"
                : message
                  ? "from-emerald-300 via-emerald-500 to-emerald-300"
                  : "from-brand-900 via-brand-500 to-gold-400",
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                  error
                    ? "bg-rose-50 text-rose-600"
                    : message
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-brand-50 text-brand-700",
                )}
              >
                {error ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                ) : message ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16v-4m0-4h.01" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 text-sm">
                {error ? (
                  <p className="text-rose-600">{error}</p>
                ) : message ? (
                  <p className="animate-fade-in text-emerald-600">{message}</p>
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
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 sm:inline-flex">
                {questions.length} savol · {questionsTotal} ball
              </span>
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

      {bankOpen ? (
        <BankImportModal
          courses={courses}
          initialCourseId={courseId}
          onClose={() => setBankOpen(false)}
          onImport={importBankQuestions}
        />
      ) : null}
    </div>
  );
}
