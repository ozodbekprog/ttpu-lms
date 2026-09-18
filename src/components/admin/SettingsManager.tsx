"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, CardBody, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ModuleFlags, ModuleKey } from "@/server/settings";

export type SettingsModule = {
  key: ModuleKey;
  title: string;
  description: string;
};

type ApiResult = { ok: boolean; data?: { modules: ModuleFlags }; error?: string };

const ICON_TONES: Record<ModuleKey, string> = {
  chat: "from-sky-400 to-blue-600 shadow-sky-500/30",
  certificates: "from-amber-300 to-gold-500 shadow-gold-500/30",
  calendar: "from-emerald-400 to-teal-600 shadow-emerald-500/30",
  catalog: "from-brand-500 to-brand-800 shadow-brand-500/30",
  forum: "from-violet-400 to-purple-600 shadow-purple-500/30",
  qr_attendance: "from-rose-400 to-pink-600 shadow-rose-500/30",
};

const MODULE_ICONS: Record<ModuleKey, ReactNode> = {
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  certificates: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  catalog: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  forum: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M21 11a9 9 0 1 0-18 0" />
      <path d="M12 3v4M8 7 6 4M16 7l2-3" />
    </svg>
  ),
  qr_attendance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h.01" />
    </svg>
  ),
};

export default function SettingsManager({
  modules,
  initialFlags,
}: {
  modules: SettingsModule[];
  initialFlags: ModuleFlags;
}) {
  const router = useRouter();
  const [flags, setFlags] = useState<ModuleFlags>(initialFlags);
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  async function toggle(item: SettingsModule) {
    const next = !flags[item.key];
    setFlags((prev) => ({ ...prev, [item.key]: next }));
    setBusyKey(item.key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: { [item.key]: next } }),
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json?.ok || !json.data) {
        setFlags((prev) => ({ ...prev, [item.key]: !next }));
        setError(json?.error ?? "Saqlab bo'lmadi");
        return;
      }
      setFlags(json.data.modules);
      setNotice(`"${item.title}" ${next ? "yoqildi" : "o'chirildi"}`);
      router.refresh();
    } catch {
      setFlags((prev) => ({ ...prev, [item.key]: !next }));
      setError("Tarmoqda xatolik");
    } finally {
      setBusyKey(null);
    }
  }

  const enabledCount = modules.filter((item) => flags[item.key]).length;

  return (
    <div className="space-y-4">
      <Card className="animate-fade-up relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        <CardBody className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-slate-500">Faol modullar</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-brand-950">
              {enabledCount}
              <span className="ml-1 text-base font-medium text-slate-400">/ {modules.length}</span>
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Progress value={enabledCount} max={modules.length} />
            <p className="mt-2 text-xs text-slate-400">
              O&apos;zgarishlar saqlanadi va darhol kuchga kiradi
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {notice ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {notice}
          </span>
        ) : null}
        {error ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item, index) => {
          const enabled = flags[item.key];
          const busy = busyKey === item.key;
          return (
            <div key={item.key} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
              <Card
                className={cn(
                  "group relative h-full overflow-hidden transition-all duration-300",
                  enabled
                    ? "border-brand-200/70 hover:shadow-lift"
                    : "border-slate-200/70 bg-slate-50/40 hover:shadow-lift",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 transition-opacity duration-300",
                    enabled ? "opacity-100" : "opacity-0",
                  )}
                />
                <CardBody className="flex items-center gap-4">
                  <span
                    className={cn(
                      "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-all duration-300",
                      ICON_TONES[item.key],
                      enabled
                        ? "scale-100 group-hover:scale-105"
                        : "scale-95 opacity-70 saturate-0 group-hover:opacity-100 group-hover:saturate-50",
                    )}
                  >
                    {MODULE_ICONS[item.key]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tracking-tight text-brand-950">{item.title}</p>
                      <span className="relative inline-flex items-center">
                        <Badge tone={enabled ? "green" : "slate"}>{enabled ? "Yoqilgan" : "O'chirilgan"}</Badge>
                        {enabled ? (
                          <span className="absolute -right-1 -top-1 size-2 animate-pulse rounded-full bg-emerald-500" />
                        ) : null}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={item.title}
                    aria-busy={busy}
                    disabled={busy}
                    onClick={() => toggle(item)}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full ring-1 ring-inset transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
                      enabled
                        ? "bg-emerald-500 ring-emerald-600/30 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                        : "bg-slate-300 ring-slate-400/20",
                      busy ? "cursor-wait opacity-70" : "cursor-pointer",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                        enabled ? "translate-x-6" : "translate-x-1",
                      )}
                    >
                      {busy ? (
                        <span className="size-3 animate-spin rounded-full border-2 border-slate-200 border-t-brand-700" />
                      ) : null}
                    </span>
                  </button>
                </CardBody>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
