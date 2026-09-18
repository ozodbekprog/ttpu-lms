"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, CardBody } from "@/components/ui";
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

  return (
    <div className="space-y-4">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {notice ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {notice}
          </span>
        ) : null}
        {error ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
            {error}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => {
          const enabled = flags[item.key];
          const busy = busyKey === item.key;
          return (
            <Card
              key={item.key}
              className={cn(
                "relative overflow-hidden transition-all duration-200",
                enabled ? "border-brand-200/70" : "border-slate-200/70 bg-slate-50/40",
              )}
            >
              {enabled ? (
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
              ) : null}
              <CardBody className="flex items-center gap-4">
                <span
                  className={cn(
                    "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-all duration-200",
                    ICON_TONES[item.key],
                    enabled ? "scale-100" : "scale-95 saturate-0",
                  )}
                >
                  {MODULE_ICONS[item.key]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold tracking-tight text-brand-950">{item.title}</p>
                    <Badge tone={enabled ? "green" : "slate"}>{enabled ? "Yoqilgan" : "O'chirilgan"}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.title}
                  disabled={busy}
                  onClick={() => toggle(item)}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
                    enabled ? "bg-emerald-500" : "bg-slate-300",
                    busy ? "cursor-wait opacity-70" : "cursor-pointer",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                      enabled ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
