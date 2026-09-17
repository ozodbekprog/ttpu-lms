"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import {
  QUESTION_TYPE_LABEL,
  type QuestionDraft,
  type QuestionFull,
  type QuestionType,
} from "@/components/quiz/shared";

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
    <Card className="border-blue-200">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Savol turi</Label>
            <Select value={type} onChange={(event) => changeType(event.target.value as QuestionType)}>
              {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((value) => (
                <option key={value} value={value}>
                  {QUESTION_TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
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
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Matnli savol avtomatik baholanmaydi — o&apos;qituvchi qo&apos;lda ball qo&apos;yadi.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Variantlar (to&apos;g&apos;risini belgilang)</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type={type === "SINGLE" ? "radio" : "checkbox"}
                  name="correct-option"
                  checked={correct.includes(index)}
                  onChange={() => toggleCorrect(index)}
                  className="size-4 shrink-0 accent-blue-600"
                />
                <Input
                  value={option}
                  onChange={(event) => changeOption(index, event.target.value)}
                  placeholder={`${index + 1}-variant`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                >
                  O&apos;chirish
                </Button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setOptions((prev) => [...prev, ""])}>
              Variant qo&apos;shish
            </Button>
          </div>
        )}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex items-center justify-end gap-2">
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
