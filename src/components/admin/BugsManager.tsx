"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Textarea } from "@/components/ui";
import { classifyBug } from "@/components/bugs/bug-utils";
import { apiFetch } from "@/lib/api";
import { fmtDateTime } from "@/lib/utils";

type BugStatus = "NEW" | "IN_REVIEW" | "FIXED" | "REJECTED";

export type BugItem = {
  id: string;
  url: string | null;
  message: string;
  stack: string | null;
  meta: Record<string, unknown> | null;
  status: BugStatus;
  adminNote: string | null;
  createdAt: string;
  user: { name: string; role: string; email: string } | null;
};

const STATUS_META: Record<BugStatus, { label: string; tone: "amber" | "blue" | "green" | "slate" }> = {
  NEW: { label: "Yangi", tone: "amber" },
  IN_REVIEW: { label: "Ko'rib chiqilmoqda", tone: "blue" },
  FIXED: { label: "Tuzatildi", tone: "green" },
  REJECTED: { label: "Rad etildi", tone: "slate" },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "Talaba",
};

export function BugsManager({ reports }: { reports: BugItem[] }) {
  const [items, setItems] = useState(reports);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(
    id: string,
    payload: { status?: BugStatus; adminNote?: string | null },
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await apiFetch(`/api/bugs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: { report: { status: BugStatus; adminNote: string | null } } }
        | null;
      if (!res.ok || !json?.ok || !json.data) {
        setError(json?.error ?? "Saqlashda xatolik yuz berdi");
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: json.data!.report.status, adminNote: json.data!.report.adminNote }
            : item,
        ),
      );
    } catch {
      setError("Tarmoqda xatolik");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Xatolik xabarlari yo'q"
        description="Foydalanuvchilar AI yordamchi orqali xatolik yuborganda shu yerda paydo bo'ladi."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {items.map((item) => {
        const suggestion = classifyBug(item.message, item.stack);
        const note = typeof item.meta?.note === "string" ? item.meta.note : null;
        const statusMeta = STATUS_META[item.status];
        const busy = busyId === item.id;
        return (
          <Card key={item.id}>
            <CardHeader
              title={item.message.length > 70 ? `${item.message.slice(0, 70)}…` : item.message}
              subtitle={`${item.user?.name ?? "Noma'lum"} · ${ROLE_LABELS[item.user?.role ?? ""] ?? "—"} · ${fmtDateTime(item.createdAt)}`}
              action={<Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
            />
            <CardBody className="space-y-3">
              <p className="rounded-xl bg-brand-50/70 px-3 py-2 text-sm text-brand-900">
                🤖 AI tahlili: <span className="font-semibold">{suggestion.title}</span> — {suggestion.hint}
              </p>

              <div className="grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-600">Sahifa:</span> {item.url ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-600">Email:</span> {item.user?.email ?? "—"}
                </p>
              </div>

              {note ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Foydalanuvchi izohi:</span> {note}
                </p>
              ) : null}

              {item.stack ? (
                <details className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">
                    Texnik tafsilotlar (faqat admin uchun)
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-600">
                    {item.stack}
                  </pre>
                </details>
              ) : null}

              <Textarea
                value={drafts[item.id] ?? item.adminNote ?? ""}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                }
                placeholder="Admin izohi (faqat adminlarga ko'rinadi)"
                rows={2}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    void update(item.id, { status: "IN_REVIEW" });
                  }}
                >
                  Ko&apos;rib chiqish
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    void update(item.id, { status: "FIXED" });
                  }}
                >
                  Tuzatildi
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    void update(item.id, { status: "REJECTED" });
                  }}
                >
                  Rad etish
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    void update(item.id, {
                      adminNote: (drafts[item.id] ?? item.adminNote ?? "").trim() || null,
                    });
                  }}
                >
                  Izohni saqlash
                </Button>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
