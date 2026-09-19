import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Progress } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { examBucket } from "./data";
import { AttendanceBanner, SessionStateBadge, SessionTypeBadge } from "./session-badges";
import {
  sheetStatusLabel,
  type StaffSessionItem,
  type StudentSessionItem,
} from "./session-shared";

const MONTHS_SHORT = ["Yanv", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

const DATE_TONES = {
  upcoming: "bg-brand-50 text-brand-700 ring-brand-100",
  today: "bg-amber-50 text-amber-700 ring-amber-100",
  past: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

function SessionDateTile({ date }: { date: Date }) {
  const bucket = examBucket(date);
  return (
    <div
      title={fmtDate(date)}
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl ring-1",
        DATE_TONES[bucket],
      )}
    >
      <span className="text-lg leading-none font-bold">{date.getDate()}</span>
      <span className="mt-1 text-[10px] font-semibold tracking-wider uppercase">
        {MONTHS_SHORT[date.getMonth()]}
      </span>
    </div>
  );
}

function sessionTime(session: { startTime: string | null; endTime: string | null }) {
  if (!session.startTime) return "Vaqt belgilanmagan";
  return session.endTime ? `${session.startTime}–${session.endTime}` : session.startTime;
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">{children}</span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn("rounded-xl px-3 py-2.5", tone)}>
      <p className="text-lg leading-none font-semibold">{value}</p>
      <p className="mt-1.5 text-[10px] font-semibold tracking-wider uppercase opacity-70">{label}</p>
    </div>
  );
}

export function StaffSessionCard({ session }: { session: StaffSessionItem }) {
  return (
    <Card className="relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/exams/sessions/${session.id}`} aria-label={session.title} className="absolute inset-0 rounded-2xl" />
      <div className="flex items-start gap-3">
        <SessionDateTile date={session.date} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight text-slate-900">{session.title}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">{session.course.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SessionTypeBadge type={session.type} />
            <SessionStateBadge date={session.date} />
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                session.admissionOpen
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {session.admissionOpen ? "Ruxsat ochiq" : "Ruxsat yopiq"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <MetaChip>{sessionTime(session)}</MetaChip>
        {session.room ? <MetaChip>{session.room}</MetaChip> : null}
        <MetaChip>{session.termName ?? "Semestrsiz"}</MetaChip>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Varaqalar" value={session.sheetCount} tone="bg-brand-50 text-brand-700" />
        <MiniStat label="O'tdi" value={session.passedCount} tone="bg-emerald-50 text-emerald-700" />
        <MiniStat label="Kutilmoqda" value={session.pendingCount} tone="bg-amber-50 text-amber-700" />
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">Ruxsatli: {session.eligibleCount} ta</span>
        <span className="text-xs font-semibold text-brand-700">Batafsil &rarr;</span>
      </div>
    </Card>
  );
}

export function StudentSessionCard({ session }: { session: StudentSessionItem }) {
  return (
    <Card className="relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/exams/sessions/${session.id}`} aria-label={session.title} className="absolute inset-0 rounded-2xl" />
      <div className="flex items-start gap-3">
        <SessionDateTile date={session.date} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-tight text-slate-900">{session.title}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">{session.course.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SessionTypeBadge type={session.type} />
            <SessionStateBadge date={session.date} />
            {session.admissionOpen ? <span className="text-xs font-medium text-emerald-600">Ruxsat ochiq</span> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Vaqt</p>
          <p className="mt-1 font-medium text-slate-700">{sessionTime(session)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Xona</p>
          <p className="mt-1 font-medium text-slate-700">{session.room ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">O&apos;rindiq</p>
          <p className="mt-1 font-semibold text-slate-700">{session.sheet?.seat ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Natija</p>
          <p className="mt-1 font-medium text-slate-700">
            {session.sheet
              ? `${sheetStatusLabel(session.sheet.status)}${session.sheet.score != null ? ` · ${session.sheet.score}` : ""}`
              : "—"}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">Davomat</span>
          <span className={cn("font-semibold", session.attendance.eligible ? "text-emerald-600" : "text-rose-600")}>
            {session.attendance.percent}%
          </span>
        </div>
        <Progress value={session.attendance.percent} />
      </div>
      <AttendanceBanner attendance={session.attendance} compact />
    </Card>
  );
}
