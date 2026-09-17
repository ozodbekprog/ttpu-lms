"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";

type ApiResult = { ok?: boolean; error?: string } | null;

export function IssueCertificateForm({
  courseId,
  students,
  issuedStudentIds,
}: {
  courseId: string;
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
    <Card>
      <CardHeader
        title="Sertifikat berish"
        subtitle={`${available.length} ta talaba kutmoqda`}
      />
      <CardBody>
        {available.length === 0 ? (
          <p className="text-sm text-slate-500">
            Bu kursdagi barcha talabalarga sertifikat berilgan.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Talaba</Label>
              <Select value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
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
              <Input
                type="number"
                min={0}
                max={100}
                value={grade}
                placeholder="Masalan: 92"
                onChange={(event) => setGrade(event.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-400">0 dan 100 gacha, ixtiyoriy</p>
            </div>
            {error ? (
              <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
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
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={busy}>
                {busy ? "Berilmoqda..." : "Sertifikat berish"}
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
