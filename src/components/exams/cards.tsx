import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { examBucket, EXAM_MIN_PERCENT, type ExamBucket, type StaffExamItem, type StudentExamItem } from "./data";

function fmtTime(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const BUCKET_BADGES: Record<ExamBucket, { label: string; tone: "blue" | "amber" | "slate" }> = {
  upcoming: { label: "Kelayotgan", tone: "blue" },
  today: { label: "Bugun", tone: "amber" },
  past: { label: "O'tgan", tone: "slate" },
};

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ExamMeta({ exam }: { exam: { dueAt: Date; timeLimitMin: number | null } }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <CalendarIcon />
        {fmtDate(exam.dueAt)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon />
        {fmtTime(exam.dueAt)}
      </span>
      <span>{exam.timeLimitMin ? `${exam.timeLimitMin} daqiqa` : "Vaqtsiz"}</span>
    </div>
  );
}

function StudentState({ exam }: { exam: StudentExamItem }) {
  const bucket = examBucket(exam.dueAt);
  if (exam.attempts.active) return <Badge tone="amber">Davom etmoqda</Badge>;
  if (exam.attempts.finished > 0) {
    return (
      <Badge tone="green">
        {exam.attempts.lastScore != null ? `Topshirilgan: ${exam.attempts.lastScore}` : "Topshirilgan"}
      </Badge>
    );
  }
  return <Badge tone={bucket === "past" ? "rose" : "slate"}>Topshirilmagan</Badge>;
}

export function StudentExamCard({ exam }: { exam: StudentExamItem }) {
  const bucket = examBucket(exam.dueAt);
  return (
    <Link href={`/quizzes/${exam.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight text-slate-900">{exam.title}</p>
            <p className="mt-0.5 truncate text-sm text-slate-500">{exam.course.title}</p>
          </div>
          <Badge tone={BUCKET_BADGES[bucket].tone}>{BUCKET_BADGES[bucket].label}</Badge>
        </div>
        <div className="mt-4">
          <ExamMeta exam={exam} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StudentState exam={exam} />
          <Badge tone={exam.attendance.eligible ? "green" : "rose"}>
            {exam.attendance.eligible ? "Imtihonga ruxsat" : "Ruxsat yo'q"}
          </Badge>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            Davomat: {exam.attendance.percent}% · {exam.attempts.finished}/{exam.maxAttempts} urinish
          </span>
          <span className="shrink-0 text-xs font-medium text-brand-700">Testni ochish &rarr;</span>
        </div>
        {exam.attendance.eligible ? null : (
          <p className="mt-2 text-xs text-rose-500">
            Imtihonga ruxsat uchun kamida {EXAM_MIN_PERCENT}% davomat kerak
          </p>
        )}
      </Card>
    </Link>
  );
}

export function StaffExamCard({ exam }: { exam: StaffExamItem }) {
  const bucket = examBucket(exam.dueAt);
  return (
    <Card className="relative flex h-full flex-col p-5 transition-shadow duration-200 hover:shadow-lift">
      <Link href={`/quizzes/${exam.id}`} aria-label={exam.title} className="absolute inset-0 rounded-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-tight text-slate-900">{exam.title}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {exam.course.title} · {exam.course.teacherName}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={BUCKET_BADGES[bucket].tone}>{BUCKET_BADGES[bucket].label}</Badge>
          <Badge tone={exam.isPublished ? "green" : "slate"}>
            {exam.isPublished ? "E'lon qilingan" : "Qoralama"}
          </Badge>
        </div>
      </div>
      <div className="mt-4">
        <ExamMeta exam={exam} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <ListIcon />
          {exam.questionCount} savol
        </span>
        <Badge tone="purple">Topshirganlar: {exam.submittedCount}</Badge>
        <span>Jami {exam.attemptCount} urinish</span>
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4">
        <ButtonLink
          href={`/quizzes/${exam.id}/results`}
          variant="secondary"
          size="sm"
          className="relative z-10"
        >
          Natijalar
        </ButtonLink>
        <ButtonLink
          href={`/quizzes/${exam.id}/edit`}
          variant="secondary"
          size="sm"
          className="relative z-10"
        >
          Tahrirlash
        </ButtonLink>
        <span className="ml-auto text-xs text-slate-400">Maks: {exam.maxAttempts} urinish</span>
      </div>
    </Card>
  );
}
