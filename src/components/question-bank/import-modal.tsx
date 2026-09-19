"use client";

import { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Input, Label, Select, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/components/quiz/api";
import {
  QUESTION_TYPE_LABEL,
  QUESTION_TYPE_TONE,
  type QuestionType,
} from "@/components/quiz/shared";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  type BankQuestionItem,
} from "@/components/question-bank/shared";

export function BankImportModal({
  courses,
  initialCourseId,
  onClose,
  onImport,
}: {
  courses: Array<{ id: string; title: string }>;
  initialCourseId: string;
  onClose: () => void;
  onImport: (items: BankQuestionItem[]) => Promise<string | null>;
}) {
  const [courseId, setCourseId] = useState(initialCourseId);
  const [type, setType] = useState<"" | QuestionType>("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<BankQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, BankQuestionItem>>({});
  const [randomCount, setRandomCount] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (type) params.set("type", type);
    if (query) params.set("q", query);
    const suffix = params.toString();
    const load = async () => {
      setLoading(true);
      const result = await apiFetch<BankQuestionItem[]>(
        `/api/question-bank${suffix ? `?${suffix}` : ""}`,
        "GET",
      );
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setItems(result.data);
    };
    void load();
    return () => {
      active = false;
    };
  }, [courseId, type, query]);

  function toggle(item: BankQuestionItem) {
    setSelected((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: item };
    });
  }

  function pickRandom() {
    if (items.length === 0) {
      setError("Bankda savollar yo'q");
      return;
    }
    const count = Number(randomCount);
    if (!Number.isInteger(count) || count < 1 || count > items.length) {
      setError(`1 dan ${items.length} gacha butun son kiriting`);
      return;
    }
    const ids = items.map((item) => item.id);
    for (let index = ids.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const current = ids[index];
      ids[index] = ids[swap];
      ids[swap] = current;
    }
    const next: Record<string, BankQuestionItem> = {};
    for (const id of ids.slice(0, count)) {
      const item = items.find((entry) => entry.id === id);
      if (item) next[id] = item;
    }
    setSelected(next);
    setError(null);
  }

  async function confirm() {
    const chosen = Object.values(selected);
    if (chosen.length === 0) {
      setError("Kamida bitta savol tanlang");
      return;
    }
    setImporting(true);
    setError(null);
    const message = await onImport(chosen);
    setImporting(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bankdan savol qo'shish"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-950/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl animate-fade-up rounded-2xl border border-slate-200 bg-white shadow-lift">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h3 className="font-semibold tracking-tight text-slate-900">Bankdan qo&apos;shish</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Kurs bo&apos;yicha savollarni tanlang va testga qo&apos;shing
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={importing}>
            Yopish
          </Button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
            <div>
              <Label>Kurs</Label>
              <Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">Barcha kurslar</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Tur</Label>
              <Select
                value={type}
                onChange={(event) => setType(event.target.value as "" | QuestionType)}
              >
                <option value="">Barchasi</option>
                {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((value) => (
                  <option key={value} value={value}>
                    {QUESTION_TYPE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Qidiruv</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Savol matni bo'yicha..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
            <span className="text-xs font-medium text-slate-600">Tasodifiy tanlash:</span>
            <Input
              type="number"
              min={1}
              max={items.length > 0 ? items.length : 1}
              value={randomCount}
              onChange={(event) => setRandomCount(event.target.value)}
              placeholder="N"
              className="h-8 w-20 px-2.5 py-1 text-xs"
            />
            <Button size="sm" variant="secondary" onClick={pickRandom} disabled={items.length === 0}>
              Tasodifiy N ta tanlash
            </Button>
            {selectedCount > 0 ? (
              <Button size="sm" variant="ghost" onClick={() => setSelected({})} disabled={importing}>
                Tanlovni tozalash
              </Button>
            ) : null}
            <span className="ml-auto text-xs text-slate-500">{selectedCount} ta tanlandi</span>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              [0, 1, 2].map((key) => (
                <div key={key} className="rounded-xl border border-slate-200 p-3.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-2.5 h-4 w-full" />
                </div>
              ))
            ) : items.length === 0 ? (
              <EmptyState
                title="Bank savollari yo'q"
                description="Tanlangan filtr bo'yicha savollar topilmadi. Avval savollar bankini to'ldiring."
              />
            ) : (
              items.map((item) => {
                const checked = selected[item.id] !== undefined;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-150",
                      checked
                        ? "border-brand-400 bg-brand-50/60"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item)}
                      className="mt-0.5 size-4 shrink-0 accent-brand-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={QUESTION_TYPE_TONE[item.type]}>
                          {QUESTION_TYPE_LABEL[item.type]}
                        </Badge>
                        <Badge tone={DIFFICULTY_TONE[item.difficulty] ?? "slate"}>
                          {DIFFICULTY_LABEL[item.difficulty] ?? "—"}
                        </Badge>
                        {item.courseTitle ? (
                          <span className="text-[11px] text-slate-400">{item.courseTitle}</span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block text-sm font-medium text-slate-900">
                        {item.text}
                      </span>
                      {item.options.length > 0 ? (
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {item.options.join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            Bekor qilish
          </Button>
          <Button onClick={() => void confirm()} disabled={importing || selectedCount === 0}>
            {importing ? "Qo'shilmoqda..." : `Qo'shish (${selectedCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
