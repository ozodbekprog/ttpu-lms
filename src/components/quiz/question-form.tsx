"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  QUESTION_TYPE_ICON,
  QUESTION_TYPE_LABEL,
  type QuestionDraft,
  type QuestionFull,
  type QuestionType,
} from "@/components/quiz/shared";

const TYPE_SHORT: Record<QuestionType, string> = {
  SINGLE: "Bitta javob",
  MULTIPLE: "Bir nechta",
  TEXT: "Matnli",
};

const TYPE_ACTIVE: Record<QuestionType, string> = {
  SINGLE: "bg-brand-700",
  MULTIPLE: "bg-purple-600",
  TEXT: "bg-amber-500",
};

function letterOf(index: number): string {
  return String.fromCharCode(65 + index);
}

export function QuestionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: QuestionFull;
  onSubmit: (draft: QuestionDraft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [type, setType] = useState<QuestionType>(initial?.type ?? "SINGLE");
  const [points, setPoints] = useState(String(initial?.points ?? 1));
  const [options, setOptions] = useState<string[]>(
    initial && initial.type !== "TEXT" && initial.options.length > 0 ? initial.options : ["", ""],
  );
  const [correct, setCorrect] = useState<number[]>(initial?.correct ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function buildDraft(): QuestionDraft | string {
    const trimmedText = text.trim();
    if (!trimmedText) return "Savol matnini kiriting";
    const pointsValue = Number(points);
    if (!Number.isInteger(pointsValue) || pointsValue < 1 || pointsValue > 100) {
      return "Ball 1 dan 100 gacha butun son bo'lishi kerak";
    }
    if (type === "TEXT") {
      return { text: trimmedText, type, options: [], correct: [], points: pointsValue };
    }
    const cleaned = options.map((option) => option.trim());
    if (cleaned.length < 2) return "Kamida 2 ta variant kiriting";
    if (cleaned.some((option) => option.length === 0)) return "Barcha variantlarni to'ldiring";
    if (type === "SINGLE" && correct.length !== 1) return "Bitta to'g'ri variantni belgilang";
    if (type === "MULTIPLE" && correct.length < 1) return "Kamida bitta to'g'ri variantni belgilang";
    return {
      text: trimmedText,
      type,
      options: cleaned,
      correct: [...correct].sort((a, b) => a - b),
      points: pointsValue,
    };
  }

  async function save() {
    const draft = buildDraft();
    if (typeof draft === "string") {
      setError(draft);
      return;
    }
    setSaving(true);
    setError(null);
    const message = await onSubmit(draft);
    if (message) {
      setError(message);
      setSaving(false);
    }
  }

  function changeType(next: QuestionType) {
    setType(next);
    setCorrect([]);
    if (next !== "TEXT" && options.length < 2) setOptions(["", ""]);
  }

  function changeOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, optionIndex) => (optionIndex === index ? value : option)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index));
    setCorrect((prev) =>
      prev.filter((item) => item !== index).map((item) => (item > index ? item - 1 : item)),
    );
  }

  function toggleCorrect(index: number) {
    if (type === "SINGLE") {
      setCorrect([index]);
      return;
    }
    setCorrect((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  }

  return (
    <Card className="border-brand-200">
      <CardHeader
        title={initial ? "Savolni tahrirlash" : "Yangi savol"}
        subtitle="Savol matni, turi, variantlari va balli"
      />
      <CardBody className="space-y-4">
        <div>
          <Label>Savol matni</Label>
          <Textarea
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Savolni kiriting..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
          <div>
            <Label>Savol turi</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((value) => {
                const active = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeType(value)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150",
                      active
                        ? cn("border-transparent text-white shadow-sm", TYPE_ACTIVE[value])
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-lg",
                        active ? "bg-white/20" : "bg-slate-100",
                      )}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={QUESTION_TYPE_ICON[value]} />
                      </svg>
                    </span>
                    {TYPE_SHORT[value]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Ball</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={points}
              onChange={(event) => setPoints(event.target.value)}
            />
          </div>
        </div>

        {type === "TEXT" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Matnli savol avtomatik baholanmaydi — o&apos;qituvchi qo&apos;lda ball qo&apos;yadi.
          </p>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">Variantlar</span>
              <span className="text-xs text-slate-400">
                {type === "SINGLE" ? "Bitta to'g'ri javobni belgilang" : "Bir nechta to'g'ri javobni belgilang"}
              </span>
            </div>
            {options.map((option, index) => {
              const checked = correct.includes(index);
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
                    checked
                      ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-400/40"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <input
                    type={type === "SINGLE" ? "radio" : "checkbox"}
                    name="correct-option"
                    checked={checked}
                    onChange={() => toggleCorrect(index)}
                    className="size-4 shrink-0 accent-emerald-600"
                  />
                  <span
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                      checked ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {checked ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      letterOf(index)
                    )}
                  </span>
                  <Input
                    value={option}
                    onChange={(event) => changeOption(index, event.target.value)}
                    placeholder={`${index + 1}-variant`}
                    className="border-transparent! bg-transparent! px-0! shadow-none! focus:border-transparent! focus:ring-0!"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-slate-400! hover:bg-rose-50! hover:text-rose-600!"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                    <span className="sr-only">Variantni o&apos;chirish</span>
                  </Button>
                </div>
              );
            })}
            <Button size="sm" variant="secondary" onClick={() => setOptions((prev) => [...prev, ""])}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Variant qo&apos;shish
            </Button>
          </div>
        )}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
