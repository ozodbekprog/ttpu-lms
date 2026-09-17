"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";
import { apiFetch } from "@/components/quiz/api";
import {
  QUESTION_TYPE_LABEL,
  type QuestionDraft,
  type QuestionFull,
} from "@/components/quiz/shared";
import { QuestionForm } from "@/components/quiz/question-form";

export type CourseOption = { id: string; title: string };

export type EditableQuiz = {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  timeLimitMin: number | null;
  maxAttempts: number;
  isPublished: boolean;
  questions: QuestionFull[];
};

const NEW_QUESTION_ID = "__new__";

export function QuizEditor({ courses, quiz }: { courses: CourseOption[]; quiz?: EditableQuiz }) {
  const router = useRouter();
  const tempCounter = useRef(0);

  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [courseId, setCourseId] = useState(quiz?.courseId ?? courses[0]?.id ?? "");
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
    return {
      title: title.trim(),
      description: description.trim() === "" ? null : description.trim(),
      courseId,
      timeLimitMin: time === "" ? null : Number(time),
      maxAttempts: Number(maxAttempts),
      isPublished,
    };
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
          subtitle={quiz ? "O'zgarishlarni saqlashni unutmang" : "Test yaratish va savollar qo'shish"}
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
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="size-4 accent-blue-600"
            />
            Talabalarga e&apos;lon qilish (published)
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {quiz ? (
              <Button variant="danger" onClick={() => void deleteQuiz()} disabled={saving}>
                Testni o&apos;chirish
              </Button>
            ) : null}
            <Button onClick={() => void saveMeta()} disabled={saving || courses.length === 0}>
              {saving ? "Saqlanmoqda..." : quiz ? "Saqlash" : "Testni yaratish"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Savollar <span className="text-sm font-normal text-slate-500">({questions.length} ta)</span>
          </h2>
          <Button
            variant="secondary"
            onClick={() => setEditingId(NEW_QUESTION_ID)}
            disabled={editingId !== null}
          >
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
              <Card key={question.id}>
                <CardBody className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{QUESTION_TYPE_LABEL[question.type]}</Badge>
                      <span className="text-xs text-slate-500">{question.points} ball</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {question.position}. {question.text}
                    </p>
                    {question.type !== "TEXT" ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {question.options.map((option, index) => (
                          <span
                            key={index}
                            className={question.correct.includes(index) ? "font-medium text-emerald-700" : ""}
                          >
                            {index > 0 ? " · " : ""}
                            {option}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
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
    </div>
  );
}
