"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Input, Label, Textarea } from "@/components/ui";

export type CourseFormData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverColor: string;
  isPublished: boolean;
};

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2", "#4f46e5", "#be185d"];

type ApiResult = { ok?: boolean; error?: string; data?: { slug?: string } } | null;

export function CourseForm({ course }: { course?: CourseFormData }) {
  const router = useRouter();
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [coverColor, setCoverColor] = useState(course?.coverColor ?? COLORS[0]);
  const [isPublished, setIsPublished] = useState(course?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(course ? `/api/courses/${course.id}` : "/api/courses", {
        method: course ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, coverColor, isPublished }),
      });
      const json = (await res.json().catch(() => null)) as ApiResult;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Saqlashda xatolik yuz berdi");
        return;
      }
      const slug = json.data?.slug ?? course?.slug;
      router.push(slug ? `/courses/${slug}` : "/courses");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Kurs nomi</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Programming Fundamentals"
              required
              minLength={2}
              maxLength={200}
            />
          </div>
          <div>
            <Label>Tavsif</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurs haqida qisqacha"
              rows={4}
            />
          </div>
          <div>
            <Label>Rang</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setCoverColor(color)}
                  className={`size-8 rounded-full border-2 transition ${
                    coverColor === color ? "border-slate-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <Input
                value={coverColor}
                onChange={(e) => setCoverColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className="w-28"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 rounded border-slate-300"
            />
            {"Kursni e'lon qilish (talabalar ko'radi)"}
          </label>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saqlanmoqda..." : course ? "Saqlash" : "Kurs yaratish"}
            </Button>
            <Link
              href={course ? `/courses/${course.slug}` : "/courses"}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Bekor qilish
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
