import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  EXAM_MIN_PERCENT,
  sessionTypeLabel,
  sheetStatusLabel,
  type AttendanceSummary,
} from "./session-shared";

const TYPE_TONES: Record<string, string> = {
  MIDTERM: "purple",
  FINAL: "blue",
  RETAKE: "amber",
};

const STATUS_TONES: Record<string, string> = {
  PENDING: "slate",
  PASSED: "green",
  FAILED: "rose",
  ABSENT: "amber",
};

function bucketOf(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (day === today) return "today";
  return day > today ? "upcoming" : "past";
}

const BUCKET_BADGES = {
  upcoming: { label: "Kelayotgan", tone: "blue" },
  today: { label: "Bugun", tone: "amber" },
  past: { label: "O'tgan", tone: "slate" },
} as const;

export function SessionTypeBadge({ type }: { type: string }) {
  return <Badge tone={TYPE_TONES[type] ?? "slate"}>{sessionTypeLabel(type)}</Badge>;
}

export function SheetStatusBadge({ status, score }: { status: string; score?: number | null }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "slate"}>
      {score != null ? `${sheetStatusLabel(status)} · ${score}` : sheetStatusLabel(status)}
    </Badge>
  );
}

export function SessionStateBadge({ date }: { date: Date }) {
  const bucket = bucketOf(date);
  return <Badge tone={BUCKET_BADGES[bucket].tone}>{BUCKET_BADGES[bucket].label}</Badge>;
}

export function AttendanceBadge({ attendance }: { attendance: AttendanceSummary }) {
  return (
    <Badge tone={attendance.eligible ? "green" : "rose"}>
      {attendance.eligible ? "Ruxsat" : "Ruxsat yo'q"} · {attendance.percent}%
    </Badge>
  );
}

export function AttendanceBanner({
  attendance,
  compact,
}: {
  attendance: AttendanceSummary;
  compact?: boolean;
}) {
  const eligible = attendance.eligible;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3.5 py-3",
        compact ? "" : "mt-4",
        eligible ? "border-emerald-200 bg-emerald-50/70" : "border-rose-200 bg-rose-50/70",
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          eligible ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
        )}
      >
        {attendance.percent}%
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm font-bold", eligible ? "text-emerald-700" : "text-rose-700")}>
          {eligible ? "Ruxsat" : "Ruxsat yo'q"}
        </p>
        <p className={cn("mt-0.5 text-xs", eligible ? "text-emerald-600/80" : "text-rose-600/80")}>
          {eligible
            ? `Davomat ${attendance.percent}% — talab bajarilgan`
            : `Davomat ${attendance.percent}% — kamida ${EXAM_MIN_PERCENT}% kerak`}
        </p>
      </div>
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-[0.14em] text-slate-700 uppercase">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
