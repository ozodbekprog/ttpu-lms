import { Badge, Button, ButtonLink, Card, EmptyState, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatShortIso, shortDayName } from "./journals-utils";
import type { JournalLesson, JournalLessonStatus } from "./journals-utils";

type BadgeTone = "slate" | "brand" | "green" | "amber" | "rose";

const STATUS_META: Record<JournalLessonStatus, { label: string; tone: BadgeTone }> = {
  done: { label: "Belgilangan", tone: "green" },
  partial: { label: "Qisman", tone: "amber" },
  empty: { label: "Belgilanmagan", tone: "rose" },
};

const DOT_TONES: Record<JournalLessonStatus, string> = {
  done: "bg-emerald-500",
  partial: "bg-amber-400",
  empty: "bg-rose-400",
};

function statusView(lesson: JournalLesson, today: string) {
  if (lesson.status === "done") return STATUS_META.done;
  if (lesson.status === "partial") return STATUS_META.partial;
  if (lesson.date < today) return STATUS_META.empty;
  if (lesson.date === today) return { label: "Bugun", tone: "brand" as BadgeTone };
  return { label: "Kutilmoqda", tone: "slate" as BadgeTone };
}

function LessonRow({
  lesson,
  today,
  delay,
}: {
  lesson: JournalLesson;
  today: string;
  delay: number;
}) {
  const view = statusView(lesson, today);
  const max = lesson.studentCount > 0 ? lesson.studentCount : 1;

  return (
    <li className="relative animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <span
        className={cn(
          "absolute -left-[22px] top-1/2 hidden size-2.5 -translate-y-1/2 rounded-full ring-4 ring-white sm:block",
          DOT_TONES[lesson.status],
        )}
      />
      <Card className="flex flex-wrap items-center gap-3 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
        <span className="inline-flex w-[4.6rem] shrink-0 flex-col rounded-xl bg-brand-50 px-2.5 py-1.5 text-brand-800">
          <span className="text-xs font-semibold">{lesson.slot}-par</span>
          <span className="text-[10px] text-brand-600">{lesson.time}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-900">
            {lesson.subject}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="truncate">{lesson.group}</span>
            {lesson.room ? (
              <>
                <span className="text-slate-300">·</span>
                <span className="truncate">{lesson.room}</span>
              </>
            ) : null}
          </span>
        </span>
        <span className="hidden w-24 shrink-0 flex-col gap-1 md:flex">
          <span className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Davomat</span>
            <span className="font-medium tabular-nums text-slate-600">
              {lesson.attendanceCount}/{lesson.studentCount}
            </span>
          </span>
          <Progress value={lesson.attendanceCount} max={max} />
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <Badge tone={view.tone}>{view.label}</Badge>
          {lesson.courseSlug ? (
            <ButtonLink
              href={`/courses/${lesson.courseSlug}/attendance/lesson?date=${lesson.date}&slot=${lesson.slot}`}
              size="sm"
            >
              Kundalikni ochish
            </ButtonLink>
          ) : (
            <span className="flex items-center gap-2">
              <Button size="sm" disabled>
                Kundalikni ochish
              </Button>
              <span className="text-[11px] text-slate-400">Kurs topilmadi</span>
            </span>
          )}
        </span>
      </Card>
    </li>
  );
}

export function JournalWeek({ lessons, today }: { lessons: JournalLesson[]; today: string }) {
  if (lessons.length === 0) {
    return (
      <EmptyState
        title="Bu haftada dars yo'q"
        description="Tanlangan hafta uchun dars jadvali topilmadi. Boshqa haftani tanlab ko'ring."
      />
    );
  }

  const groups: Array<{ date: string; items: JournalLesson[] }> = [];
  for (const lesson of lessons) {
    const last = groups[groups.length - 1];
    if (last && last.date === lesson.date) last.items.push(lesson);
    else groups.push({ date: lesson.date, items: [lesson] });
  }

  return (
    <div className="space-y-6">
      {groups.map((group, sectionIndex) => {
        const first = group.items[0];
        const isToday = group.date === today;
        const isPast = group.date < today;
        return (
          <section
            key={group.date}
            className="animate-fade-up"
            style={{ animationDelay: `${sectionIndex * 50}ms` }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-wide",
                  isToday
                    ? "bg-brand-900 text-white shadow-sm"
                    : isPast
                      ? "bg-slate-100 text-slate-500"
                      : "bg-white text-slate-400 ring-1 ring-slate-200",
                )}
              >
                <span>{shortDayName(first.dayOfWeek)}</span>
                <span className="text-[9px] font-medium normal-case">
                  {formatShortIso(group.date).slice(0, 5)}
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {first.day}
                  {isToday ? (
                    <span className="ml-2 text-xs font-medium text-brand-600">Bugun</span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-400">{formatShortIso(group.date)}</p>
              </div>
              <span className="ml-auto text-xs text-slate-400">
                {group.items.length} ta dars
              </span>
            </div>
            <ol className="ml-4 space-y-2 border-l-2 border-slate-100 pl-4">
              {group.items.map((lesson, lessonIndex) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  today={today}
                  delay={lessonIndex * 40}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
