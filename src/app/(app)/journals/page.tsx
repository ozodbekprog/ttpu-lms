import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getWeeklyJournals } from "@/app/api/journals/data";
import { JournalWeek } from "@/components/journals/journal-week";
import {
  addDaysIso,
  mondayOfIso,
  tashkentToday,
  weekLabel,
} from "@/components/journals/journals-utils";

function WeekNavButton({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "prev" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </Link>
  );
}

export default async function JournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const query = await searchParams;
  const week = typeof query.week === "string" ? query.week : null;
  const data = await getWeeklyJournals(user, week);

  const currentWeek = mondayOfIso(tashkentToday());
  const isCurrent = data.week === currentWeek;
  const done = data.lessons.filter((lesson) => lesson.status === "done").length;
  const partial = data.lessons.filter((lesson) => lesson.status === "partial").length;
  const missed = data.lessons.filter(
    (lesson) => lesson.status === "empty" && lesson.date < data.today,
  ).length;

  const nav = (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <WeekNavButton
        href={`/journals?week=${addDaysIso(data.week, -7)}`}
        label="Oldingi hafta"
        direction="prev"
      />
      <Link
        href="/journals"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
          isCurrent ? "bg-brand-900 text-white" : "text-slate-600 hover:bg-slate-100",
        )}
      >
        Bugun
      </Link>
      <WeekNavButton
        href={`/journals?week=${addDaysIso(data.week, 7)}`}
        label="Keyingi hafta"
        direction="next"
      />
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Davomat"
        title="Kundaliklar"
        subtitle={`${weekLabel(data.week)} · ${data.lessons.length} ta dars${
          user.role === "ADMIN" ? " · barcha o'qituvchilar" : ""
        }`}
        action={nav}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Belgilangan" value={done} hint="To'liq belgilangan darslar" />
        <Stat label="Qisman" value={partial} hint="Qismatan belgilangan darslar" />
        <Stat
          label="Belgilanmagan"
          value={missed}
          hint="O'tib ketgan, belgilanmagan darslar"
        />
      </div>
      <JournalWeek lessons={data.lessons} today={data.today} />
    </>
  );
}
