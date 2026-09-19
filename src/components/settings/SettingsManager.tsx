"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, CardBody, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  REMINDER_HOURS,
  reminderHourLabel,
  type UserPreferences,
} from "@/components/settings/preferences";

type ApiResult = { ok: boolean; data?: { preferences: UserPreferences }; error?: string };

type ToggleKey = "reminderBot" | "deadlineReminder" | "emailNotify" | "showCharts" | "scheduleListView";

type BusyKey = keyof UserPreferences;

type ToggleItem = {
  key: ToggleKey;
  title: string;
  description: string;
  enabledNotice: string;
  disabledNotice: string;
};

const REMINDER_ITEMS: ToggleItem[] = [
  {
    key: "reminderBot",
    title: "Bot eslatmalari",
    description: "Telegram bot har kuni dars jadvali va vazifalar haqida eslatib turadi.",
    enabledNotice: "Bot eslatmalari yoqildi",
    disabledNotice: "Bot eslatmalari o'chirildi",
  },
  {
    key: "deadlineReminder",
    title: "Deadline eslatmasi",
    description: "Topshiriq muddati yaqinlashganda qo'shimcha eslatma yuboriladi.",
    enabledNotice: "Deadline eslatmasi yoqildi",
    disabledNotice: "Deadline eslatmasi o'chirildi",
  },
  {
    key: "emailNotify",
    title: "Email bildirishnomalari",
    description: "Muhim bildirishnomalar email manzilingizga ham yuboriladi.",
    enabledNotice: "Email bildirishnomalari yoqildi",
    disabledNotice: "Email bildirishnomalari o'chirildi",
  },
];

const VIEW_ITEMS: ToggleItem[] = [
  {
    key: "showCharts",
    title: "Dashboard chartlari",
    description: "Bosh sahifada statistika diagrammalarini ko'rsatish.",
    enabledNotice: "Chartlar ko'rsatiladi",
    disabledNotice: "Chartlar yashirildi",
  },
  {
    key: "scheduleListView",
    title: "Jadval ro'yxat ko'rinishi",
    description: "Dars jadvali sahifasi default holatda ro'yxat shaklida ochiladi.",
    enabledNotice: "Jadval ro'yxat ko'rinishida ochiladi",
    disabledNotice: "Jadval oddiy ko'rinishda ochiladi",
  },
];

const TOGGLE_TONES: Record<ToggleKey, string> = {
  reminderBot: "from-sky-400 to-blue-600 shadow-sky-500/30",
  deadlineReminder: "from-amber-300 to-gold-500 shadow-gold-500/30",
  emailNotify: "from-rose-400 to-pink-600 shadow-rose-500/30",
  showCharts: "from-emerald-400 to-teal-600 shadow-emerald-500/30",
  scheduleListView: "from-brand-500 to-brand-800 shadow-brand-500/30",
};

const TOGGLE_ICONS: Record<ToggleKey, ReactNode> = {
  reminderBot: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  deadlineReminder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 13v3M12 19h.01" />
    </svg>
  ),
  emailNotify: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  showCharts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 17v-5M12 17V8M17 17v-9" />
    </svg>
  ),
  scheduleListView: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
};

const HOUR_TONE = "from-violet-400 to-purple-600 shadow-purple-500/30";

const TELEGRAM_TONE = "from-sky-400 to-blue-600 shadow-sky-500/30";

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function SectionHeading({
  icon,
  title,
  note,
}: {
  icon: ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="inline-flex size-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
        {icon}
      </span>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{title}</h2>
      <span className="ml-auto text-xs text-slate-400">{note}</span>
    </div>
  );
}

export default function SettingsManager({
  initialPreferences,
  email,
  telegramLinked,
}: {
  initialPreferences: UserPreferences;
  email: string;
  telegramLinked: boolean;
}) {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  const [busyKey, setBusyKey] = useState<BusyKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  async function persist(
    patch: Partial<UserPreferences>,
    revert: Partial<UserPreferences>,
    key: BusyKey,
    message: string,
  ) {
    setPreferences((prev) => ({ ...prev, ...patch }));
    setBusyKey(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json?.ok || !json.data) {
        setPreferences((prev) => ({ ...prev, ...revert }));
        setError(json?.error ?? "Saqlab bo'lmadi");
        return;
      }
      setPreferences(json.data.preferences);
      setNotice(message);
      router.refresh();
    } catch {
      setPreferences((prev) => ({ ...prev, ...revert }));
      setError("Tarmoqda xatolik");
    } finally {
      setBusyKey(null);
    }
  }

  function toggle(item: ToggleItem) {
    const next = !preferences[item.key];
    const patch: Partial<UserPreferences> = {};
    const revert: Partial<UserPreferences> = {};
    patch[item.key] = next;
    revert[item.key] = preferences[item.key];
    void persist(patch, revert, item.key, next ? item.enabledNotice : item.disabledNotice);
  }

  function changeHour(hour: number) {
    if (hour === preferences.reminderHour) return;
    void persist(
      { reminderHour: hour },
      { reminderHour: preferences.reminderHour },
      "reminderHour",
      `Eslatma vaqti ${reminderHourLabel(hour)} ga o'zgartirildi`,
    );
  }

  function renderToggle(item: ToggleItem) {
    const enabled = preferences[item.key];
    const busy = busyKey === item.key;
    return (
      <Card
        key={item.key}
        className={cn(
          "group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
          enabled ? "border-brand-200/70" : "border-slate-200/70 bg-slate-50/40",
        )}
      >
        {enabled ? (
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        ) : null}
        <CardBody className="flex items-center gap-4">
          <span
            className={cn(
              "relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white transition-all duration-300",
              TOGGLE_TONES[item.key],
              enabled ? "scale-100 shadow-lg" : "scale-95 opacity-75 saturate-0",
            )}
          >
            {TOGGLE_ICONS[item.key]}
            {enabled ? (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold tracking-tight text-brand-950">{item.title}</p>
              <Badge tone={enabled ? "green" : "slate"}>{enabled ? "Yoqilgan" : "O'chirilgan"}</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={item.title}
            disabled={busy}
            onClick={() => toggle(item)}
            className={cn(
              "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
              enabled ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-slate-200",
              busy ? "cursor-wait opacity-70" : "cursor-pointer",
            )}
          >
            <span
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300",
                enabled ? "translate-x-6" : "translate-x-0",
              )}
            >
              {busy ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="animate-spin text-slate-400">
                  <path d="M21 12a9 9 0 1 1-6.2-8.6" />
                </svg>
              ) : enabled ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : null}
            </span>
          </button>
        </CardBody>
      </Card>
    );
  }

  const hourBusy = busyKey === "reminderHour";

  return (
    <div className="space-y-8">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {notice ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {notice}
          </span>
        ) : null}
        {error ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </span>
        ) : null}
      </div>

      <section>
        <SectionHeading
          icon={
            <SectionIcon>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </SectionIcon>
          }
          title="Bildirishnomalar"
          note={`${REMINDER_ITEMS.length} ta sozlama`}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {REMINDER_ITEMS.map(renderToggle)}
          <Card className="group relative overflow-hidden border-brand-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
            <CardBody className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-200 group-hover:scale-105",
                  HOUR_TONE,
                )}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-tight text-brand-950">Eslatma vaqti</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Bot eslatmalari yuboriladigan vaqt (07:00–10:00).
                </p>
              </div>
              <Select
                className="w-28 shrink-0"
                value={preferences.reminderHour}
                disabled={hourBusy}
                aria-label="Eslatma vaqti"
                onChange={(e) => changeHour(Number(e.target.value))}
              >
                {REMINDER_HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {reminderHourLabel(hour)}
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeading
          icon={
            <SectionIcon>
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </SectionIcon>
          }
          title="Ko'rinish"
          note={`${VIEW_ITEMS.length} ta sozlama`}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {VIEW_ITEMS.map(renderToggle)}
        </div>
      </section>

      <section>
        <SectionHeading
          icon={
            <SectionIcon>
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </SectionIcon>
          }
          title="Aloqa"
          note={telegramLinked ? "Bog'langan" : "Bog'lanmagan"}
        />
        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-200",
            telegramLinked ? "border-brand-200/70" : "border-slate-200/70",
          )}
        >
          {telegramLinked ? (
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
          ) : null}
          <CardBody className="flex flex-wrap items-center gap-4">
            <span
              className={cn(
                "relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                telegramLinked ? TELEGRAM_TONE : "from-slate-300 to-slate-500 shadow-slate-400/30",
              )}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" />
                <path d="M22 2 11 13" />
              </svg>
              {telegramLinked ? (
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold tracking-tight text-brand-950">Telegram bot</p>
                <Badge tone={telegramLinked ? "green" : "amber"}>
                  {telegramLinked ? "Bog'langan" : "Bog'lanmagan"}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {telegramLinked
                  ? "Bot eslatmalari quyidagi email orqali bog'langan."
                  : "Botga ulanish uchun botga /start yuborib, quyidagi emailni kiriting."}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                {email}
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
