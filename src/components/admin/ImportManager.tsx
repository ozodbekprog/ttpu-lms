"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Table } from "@/components/ui";
import { cn } from "@/lib/utils";

type ImportType = "students" | "groups" | "subjects";

type ImportItem = {
  row: number;
  status: "created" | "skipped";
  label: string;
  detail: string;
  email?: string;
  password?: string;
};

type ImportData = {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  items: ImportItem[];
};

type ImportResponse = { ok: true; data: ImportData } | { ok: false; error: string };

const MAX_SIZE = 5 * 1024 * 1024;

const TYPES: { id: ImportType; title: string; description: string; format: string; icon: ReactNode }[] = [
  {
    id: "students",
    title: "Talabalar",
    description: "Har bir qator uchun STUDENT roli bilan foydalanuvchi yaratiladi, guruh avtomatik topiladi yoki ochiladi.",
    format: "ism,email,guruh,subGroup,telefon",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "groups",
    title: "Guruhlar",
    description: "Guruhlar nomi bo'yicha yaratiladi, fakultet mavjud bo'lmasa avtomatik ochiladi.",
    format: "nomi,yil,fakultet",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 2 9 5-9 5-9-5 9-5" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </svg>
    ),
  },
  {
    id: "subjects",
    title: "Fanlar",
    description: "Fanlar kodi va rangi bilan yaratiladi, mavjud fanlar o'tkazib yuboriladi.",
    format: "nomi,kod,rang",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export default function ImportManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [type, setType] = useState<ImportType>("students");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportData | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = TYPES.find((item) => item.id === type) ?? TYPES[0];
  const createdWithPassword = result ? result.items.filter((item) => item.status === "created" && item.password) : [];

  function selectType(next: ImportType) {
    setType(next);
    setResult(null);
    setError(null);
    setFileName(null);
    setCopied(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !inputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    setFileName(file.name);
    setError(null);
    setResult(null);
  }

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Avval CSV faylni tanlang");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Fayl hajmi 5MB dan oshmasligi kerak");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setCopied(false);

    const body = new FormData();
    body.append("file", file);
    body.append("type", type);

    try {
      const res = await fetch("/api/admin/import", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as ImportResponse | null;
      if (!res.ok || !json || !json.ok) {
        setError(json && !json.ok ? json.error : "Importni bajarib bo'lmadi");
        return;
      }
      setResult(json.data);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Tarmoqda xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function copyPasswords() {
    const lines = createdWithPassword
      .map((item) => `${item.email ?? item.label} — ${item.password}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Nusxalash imkoni bo'lmadi");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {TYPES.map((item, index) => {
          const active = item.id === type;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => selectType(item.id)}
              style={{ animationDelay: `${index * 60}ms` }}
              className={cn(
                "animate-fade-up group relative rounded-2xl border p-4 text-left transition-all duration-200",
                active
                  ? "border-brand-300 bg-gradient-to-b from-brand-50/80 to-white shadow-lift ring-2 ring-brand-500/15"
                  : "border-slate-200/70 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-xl transition-colors duration-200",
                  active
                    ? "bg-gradient-to-br from-brand-800 to-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-700",
                )}
              >
                {item.icon}
              </span>
              <span className="mt-3 block font-semibold text-slate-900">{item.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{item.description}</span>
              <span className="mt-3 block truncate rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-500">
                {item.format}
              </span>
              {active ? (
                <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title={`${selected.title} importi`}
          subtitle={`CSV ustunlari: ${selected.format}`}
          action={
            <a
              href={`/api/admin/import/template?type=${type}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M4 21h16" />
              </svg>
              Namuna CSV
            </a>
          }
        />
        <CardBody>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name ?? null);
              setResult(null);
            }}
          />
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-150",
              dragging
                ? "border-brand-400 bg-brand-50/70"
                : "border-slate-300 bg-slate-50/60 hover:border-brand-300 hover:bg-brand-50/40",
            )}
          >
            <span
              className={cn(
                "mb-1 inline-flex size-11 items-center justify-center rounded-full transition-colors duration-150",
                dragging ? "bg-brand-100 text-brand-700" : "bg-white text-slate-400 shadow-sm",
              )}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8M8 17h8" />
              </svg>
            </span>
            <span className="max-w-full truncate text-sm font-medium text-slate-700">
              {fileName ?? "CSV faylni bu yerga tashlang"}
            </span>
            <span className="text-xs text-slate-400">
              {fileName ? "Import qilish uchun tugmani bosing" : "yoki bosib fayl tanlang · maks 5MB"}
            </span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={upload} disabled={busy || !fileName}>
              {busy ? "Import qilinmoqda..." : "Import qilish"}
            </Button>
            <span className="text-xs text-slate-400">
              {busy ? "Qatorlar tekshirilmoqda, biroz kuting" : "Takroriy yozuvlar o'tkazib yuboriladi"}
            </span>
          </div>
          {error ? (
            <p className="animate-fade-in mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}
        </CardBody>
      </Card>

      {result ? (
        <Card className="animate-fade-up border-brand-200/70">
          <CardHeader
            title="Import natijasi"
            subtitle={`${selected.title} · ${result.created + result.skipped + result.errors.length} qator qayta ishlandi`}
            action={
              createdWithPassword.length > 0 ? (
                <Button variant={copied ? "secondary" : "primary"} size="sm" onClick={copyPasswords}>
                  {copied ? "Nusxalandi" : `Parollarni nusxalash (${createdWithPassword.length})`}
                </Button>
              ) : null
            }
          />
          <CardBody>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Yaratildi: <span className="tabular-nums font-semibold">{result.created}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                </svg>
                O&apos;tkazib yuborildi: <span className="tabular-nums font-semibold">{result.skipped}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Xatolar: <span className="tabular-nums font-semibold">{result.errors.length}</span>
              </span>
            </div>

            {result.items.length > 0 ? (
              <Table className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-100">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-4 py-3 font-semibold backdrop-blur">Qator</th>
                    <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-4 py-3 font-semibold backdrop-blur">Holat</th>
                    <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-4 py-3 font-semibold backdrop-blur">Ma&apos;lumot</th>
                    <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-4 py-3 font-semibold backdrop-blur">Parol</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr
                      key={`${item.row}-${item.label}`}
                      className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 tabular-nums text-slate-500">{item.row}</td>
                      <td className="px-4 py-3">
                        <Badge tone={item.status === "created" ? "green" : "amber"}>
                          {item.status === "created" ? "Yaratildi" : "O'tkazildi"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.detail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {item.password ? (
                          <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-brand-900">
                            {item.password}
                          </code>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : null}

            {result.errors.length > 0 ? (
              <div className="animate-fade-up mt-4 overflow-hidden rounded-xl border border-rose-100 bg-rose-50/50">
                <p className="border-b border-rose-100 px-4 py-2.5 text-sm font-semibold text-rose-700">Xato qatorlar</p>
                <ul className="divide-y divide-rose-100/70">
                  {result.errors.map((item) => (
                    <li key={`${item.row}-${item.message}`} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        Qator {item.row}
                      </span>
                      <span className="text-rose-700">{item.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.items.length === 0 && result.errors.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="Faylda ma'lumot topilmadi" description="CSV fayl bo'sh yoki ustunlar tanilmadi." />
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
