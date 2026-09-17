"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

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
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader
        title={course ? "Kurs ma'lumotlari" : "Yangi kurs yaratish"}
        subtitle="Maydonlarni to'ldiring va saqlang"
      />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-7">
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                1
              </span>
              <h3 className="text-sm font-semibold text-brand-950">Asosiy ma&apos;lumotlar</h3>
            </div>
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
          </section>

          <div className="border-t border-slate-100" />

          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                2
              </span>
              <h3 className="text-sm font-semibold text-brand-950">Ko&apos;rinish</h3>
            </div>
            <div>
              <Label>Kurs rangi</Label>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => setCoverColor(color)}
                    className={cn(
                      "relative inline-flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 transition-all duration-150",
                      coverColor === color ? "ring-brand-900" : "ring-transparent hover:ring-slate-300",
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {coverColor === color ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                ))}
                <Input
                  value={coverColor}
                  onChange={(e) => setCoverColor(e.target.value)}
                  pattern="^#[0-9a-fA-F]{6}$"
                  className="w-28"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                3
              </span>
              <h3 className="text-sm font-semibold text-brand-950">Holat</h3>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors duration-150 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 accent-brand-900"
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  Kursni e&apos;lon qilish
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  E&apos;lon qilinganda talabalar kursni ko&apos;radi.
                </span>
              </span>
            </label>
          </section>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "Saqlanmoqda..." : course ? "Saqlash" : "Kurs yaratish"}
            </Button>
            <ButtonLink
              href={course ? `/courses/${course.slug}` : "/courses"}
              variant="secondary"
              size="lg"
            >
              Bekor qilish
            </ButtonLink>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
