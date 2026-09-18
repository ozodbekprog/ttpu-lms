"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";

type ApiResult = { ok?: boolean; error?: string } | null;

function SealBadge() {
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-gold-300/20 text-gold-600 ring-1 ring-gold-400/40">
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="9" r="5.5" />
        <circle cx="12" cy="9" r="3" strokeDasharray="1.8 1.8" />
        <path d="m8.7 13.8-1.3 6.4L12 17.7l4.6 2.5-1.3-6.4" />
      </svg>
    </span>
  );
}

export function IssueCertificateForm({
  courseId,
  courseTitle,
  students,
  issuedStudentIds,
}: {
  courseId: string;
  courseTitle: string;
  students: { id: string; name: string }[];
  issuedStudentIds: string[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const issued = new Set(issuedStudentIds);
  const available = students.filter((student) => !issued.has(student.id));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentId) {
      setError("Talabani tanlang");
      return;
    }
    const parsedGrade = grade.trim() === "" ? null : Number(grade);
    if (parsedGrade != null && (!Number.isInteger(parsedGrade) || parsedGrade < 0 || parsedGrade > 100)) {
      setError("Ball 0 dan 100 gacha butun son bo'lishi kerak");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, studentId, grade: parsedGrade }),
      });
      const json = (await response.json().catch(() => null)) as ApiResult;
      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "Sertifikat berishda xatolik yuz berdi");
        return;
      }
      setStudentId("");
      setGrade("");
      setMessage("Sertifikat berildi");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <span className="block h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
      <CardHeader
        title={
          <span className="flex items-center gap-2.5">
            <SealBadge />
            Sertifikat berish
          </span>
        }
        subtitle={`${available.length} ta talaba kutmoqda · ${courseTitle}`}
      />
      <CardBody>
        {available.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-10 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <p className="text-sm font-medium text-emerald-800">Barcha talabalarga berilgan</p>
            <p className="max-w-sm text-xs text-emerald-700/80">
              Bu kursdagi har bir talaba sertifikatga ega. Yangi sertifikat qo&apos;shish uchun
              talabalarni kursga yozing.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Talaba</Label>
              <Select
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                required
              >
                <option value="">Talabani tanlang...</option>
                {available.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Ball (ixtiyoriy)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={grade}
                  placeholder="Masalan: 92"
                  onChange={(event) => setGrade(event.target.value)}
                  className="pr-14"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  ball
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                0 dan 100 gacha butun son, ixtiyoriy
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-brand-50/70 px-3 py-2.5 text-xs text-brand-800 ring-1 ring-brand-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </svg>
              Seriya raqami sertifikat yaratilganda avtomatik shakllantiriladi.
            </div>

            <div aria-live="polite">
              {error ? (
                <p className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {message}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={busy} className="min-w-40">
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Berilmoqda...
                  </span>
                ) : (
                  "Sertifikat berish"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
