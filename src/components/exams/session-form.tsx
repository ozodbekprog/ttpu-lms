"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Label, Select } from "@/components/ui";
import { SESSION_TYPES, SESSION_TYPE_LABEL } from "./session-shared";

type CourseOption = { id: string; title: string };
type TermOption = { id: string; name: string; isActive: boolean };

export function SessionCreateForm({ courses, terms }: { courses: CourseOption[]; terms: TermOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("FINAL");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");
  const [termId, setTermId] = useState("");
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/exams/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        title,
        type,
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        room: room.trim() || null,
        admissionOpen,
        termId: termId || null,
      }),
    });
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      data?: { id?: string };
    } | null;

    setSaving(false);
    if (!response.ok || !json?.ok || !json.data?.id) {
      setError(json?.error ?? "Saqlashda xatolik yuz berdi");
      return;
    }

    router.push(`/exams/sessions/${json.data.id}`);
    router.refresh();
  }

  if (courses.length === 0) {
    return (
      <Card className="mb-6">
        <CardBody>
          <p className="text-sm text-slate-500">
            Sessiya yaratish uchun avval kurs kerak. Kurslar bo&apos;limidan kurs qo&apos;shing.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (!open) {
    return (
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setOpen(true)} size="lg">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yangi sessiya
        </Button>
      </div>
    );
  }

  return (
    <Card className="animate-fade-up mb-6">
      <CardHeader
        title="Yangi imtihon sessiyasi"
        subtitle="Kurs, tur, sana va vaqtni belgilang"
        action={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Yopish"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }
      />
      <CardBody>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Kurs</Label>
              <Select value={courseId} onChange={(event) => setCourseId(event.target.value)} required>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Imtihon turi</Label>
              <Select value={type} onChange={(event) => setType(event.target.value)}>
                {SESSION_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {SESSION_TYPE_LABEL[item]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Sarlavha</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
                placeholder="Masalan: Programming Fundamentals yakuniy imtihoni"
              />
            </div>
            <div>
              <Label>Sana</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </div>
            <div>
              <Label>Xona</Label>
              <Input
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                maxLength={100}
                placeholder="Masalan: 305"
              />
            </div>
            <div>
              <Label>Boshlanish vaqti</Label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div>
              <Label>Tugash vaqti</Label>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
            {terms.length > 0 ? (
              <div>
                <Label>Semestr</Label>
                <Select value={termId} onChange={(event) => setTermId(event.target.value)}>
                  <option value="">Semestrsiz</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                      {term.isActive ? " (faol)" : ""}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <label className="flex items-center gap-2.5 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={admissionOpen}
                onChange={(event) => setAdmissionOpen(event.target.checked)}
                className="size-4 rounded border-slate-300 accent-brand-700"
              />
              Ruxsatni darhol ochish
            </label>
          </div>
          {error ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Sessiya yaratish"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
