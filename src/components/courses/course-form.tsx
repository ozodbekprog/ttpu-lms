"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, Card, CardBody, CardHeader, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

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
      const res = await apiFetch(course ? `/api/courses/${course.id}` : "/api/courses", {
        method: course ? "PATCH" : "POST",
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
        <div
          className="relative mb-7 overflow-hidden rounded-2xl px-5 py-4 text-white shadow-card"
          style={{ background: `linear-gradient(125deg, ${coverColor} 0%, #131f3c 92%)` }}
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-20%,rgba(255,255,255,0.25),transparent_55%)]" />
          <span className="pointer-events-none absolute -right-8 -top-12 size-32 rounded-full bg-white/10 blur-2xl" />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
            Ko&apos;rinish
          </p>
          <p className="relative mt-1 font-semibold tracking-tight">
            {title.trim() ? title : "Kurs nomi"}
          </p>
          <p className="relative mt-1 text-xs text-white/70">
            {isPublished ? "E'lon qilingan" : "Qoralama"}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-7">
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-sm">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
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
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-sm">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7z" />
                </svg>
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
                      "relative inline-flex size-9 items-center justify-center rounded-full shadow-sm ring-2 ring-offset-2 transition-all duration-150",
                      coverColor === color
                        ? "scale-105 ring-brand-900"
                        : "ring-transparent hover:scale-105 hover:ring-slate-300",
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
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-sm">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <h3 className="text-sm font-semibold text-brand-950">Holat</h3>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-150 hover:border-brand-200 hover:bg-white">
              <span className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-inset ring-slate-200">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Kursni e&apos;lon qilish
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    E&apos;lon qilinganda talabalar kursni ko&apos;radi.
                  </span>
                </span>
              </span>
              <span className="relative inline-flex shrink-0">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors duration-200 peer-checked:bg-brand-900 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20" />
                <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
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
