import Link from "next/link";
import { requireUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, ButtonLink, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { cn, dayName, fmtDate, initials } from "@/lib/utils";
import { getAdminAnalytics, getStudentAnalytics, getTeacherAnalytics } from "./analytics";
import type { AdminAnalytics, StudentAnalytics, TeacherAnalytics } from "./analytics";
import {
  SLOT_TIMES,
  dateFromIso,
  matchCourseSlug,
  normalizeTeacherName,
  todayIso,
} from "@/components/attendance/lesson-utils";
import type { CourseOption } from "@/components/attendance/lesson-utils";
import type { ReactNode } from "react";

const PAIR_TIMES: Record<number, string> = {
  1: "08:30",
  2: "10:00",
  3: "11:30",
  4: "13:30",
  5: "15:00",
  6: "16:30",
};

const STAT_TONES = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  gold: "bg-gold-300/20 text-gold-600 ring-gold-300/40",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
} as const;

type TodayLesson = {
  id: string;
  slot: number;
  subject: string;
  room: string | null;
  groupName: string;
  href: string | null;
  statusText: string;
  marked: boolean;
};

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: keyof typeof STAT_TONES;
  icon: ReactNode;
}) {
  return (
    <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-slate-400">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
            STAT_TONES[tone],
          )}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

function DateChip({ overdue, soon, children }: { overdue: boolean; soon: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium",
        overdue ? "bg-rose-50 text-rose-600" : soon ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500",
      )}
    >
      {children}
    </span>
  );
}

function AnalyticsHeading({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-brand-950">Tahlillar</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function AnalyticsCard({
  title,
  subtitle,
  delay,
  empty,
  emptyDescription,
  children,
}: {
  title: string;
  subtitle: string;
  delay: number;
  empty: boolean;
  emptyDescription: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="h-full">
        <CardHeader title={title} subtitle={subtitle} />
        <CardBody>
          {empty ? (
            <EmptyState title="Hali ma'lumot yo'q" description={emptyDescription} />
          ) : (
            children
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StudentAnalyticsSection({ data }: { data: StudentAnalytics }) {
  return (
    <section className="mt-8">
      <AnalyticsHeading subtitle="Davomat va baholar bo'yicha shaxsiy ko'rsatkichlar" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title="Davomat taqsimoti"
          subtitle="Barcha kurslar bo'yicha yozuvlar"
          delay={60}
          empty={data.attendanceTotal === 0}
          emptyDescription="Davomat yozuvlari paydo bo'lganda taqsimot shu yerda ko'rinadi."
        >
          <DonutChart data={data.attendance} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Kurslar bo'yicha davomat"
          subtitle="Keldi foizi (kechikkan va sababli bilan)"
          delay={120}
          empty={data.courseAttendance.length === 0}
          emptyDescription="Darslar belgilangach kurslar kesimida foiz ko'rinadi."
        >
          <BarChart data={data.courseAttendance} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Baholar dinamikasi"
          subtitle="Topshiriq va testlar, oxirgi 10 natija"
          delay={180}
          empty={data.gradeTrend.length === 0}
          emptyDescription="Baholangan topshiriq yoki test natijalari hali yo'q."
        >
          <LineChart data={data.gradeTrend} />
        </AnalyticsCard>
      </div>
    </section>
  );
}

function TeacherAnalyticsSection({ data }: { data: TeacherAnalytics }) {
  return (
    <section className="mt-8">
      <AnalyticsHeading subtitle="Kurslaringiz bo'yicha ko'rsatkichlar va so'nggi 14 kunlik dinamika" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title="Topshiriqlar topshirilishi"
          subtitle="So'nggi 14 kunda yuborilgan ishlar"
          delay={60}
          empty={!data.submissionsByDay.some((point) => point.value > 0)}
          emptyDescription="So'nggi 14 kunda topshirilgan ish yo'q."
        >
          <BarChart data={data.submissionsByDay} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Davomat dinamikasi"
          subtitle="Faol dars kunlari bo'yicha o'rtacha foiz"
          delay={120}
          empty={data.attendanceByDay.length === 0}
          emptyDescription="So'nggi 14 kunda davomat yozuvlari yo'q."
        >
          <LineChart data={data.attendanceByDay} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Kurslardagi talabalar"
          subtitle="Har kurs bo'yicha yozilganlar soni"
          delay={180}
          empty={data.studentsByCourse.length === 0}
          emptyDescription="Kurslaringizga hali talaba yozilmagan."
        >
          <BarChart data={data.studentsByCourse} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Topshiriqlar holati"
          subtitle="Barcha topshiriqlar bo'yicha holatlar"
          delay={240}
          empty={!data.submissionStatus.some((slice) => slice.value > 0)}
          emptyDescription="Topshiriqlar yuborilganda holatlar shu yerda ko'rinadi."
        >
          <DonutChart data={data.submissionStatus} />
        </AnalyticsCard>
      </div>
    </section>
  );
}

function AdminAnalyticsSection({ data }: { data: AdminAnalytics }) {
  return (
    <section className="mt-8">
      <AnalyticsHeading subtitle="Tizim ko'rsatkichlari va so'nggi 14 kunlik dinamika" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title="Foydalanuvchilar rollari"
          subtitle="Talabalar, o'qituvchilar va adminlar nisbati"
          delay={60}
          empty={data.usersByRole.every((slice) => slice.value === 0)}
          emptyDescription="Foydalanuvchilar mavjud emas."
        >
          <DonutChart data={data.usersByRole} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Topshiriqlar dinamikasi"
          subtitle="So'nggi 14 kunda yuborilgan ishlar"
          delay={120}
          empty={!data.submissionsByDay.some((point) => point.value > 0)}
          emptyDescription="So'nggi 14 kunda topshirilgan ish yo'q."
        >
          <BarChart data={data.submissionsByDay} />
        </AnalyticsCard>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const firstName = user.name.split(" ")[0];
  const roleLabel =
    user.role === "ADMIN"
      ? "Administrator paneli"
      : user.role === "TEACHER"
        ? "O'qituvchi paneli"
        : `${user.group?.name ?? "Talaba"} guruhi`;

  const hero = (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-6 text-white shadow-card md:p-8">
      <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-gold-400/10 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <Avatar name={user.name} className="size-14! text-base ring-4 ring-white/10" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
            {dayName(now.getDay())}, {fmtDate(now)}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">
            Salom, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-brand-100">{roleLabel}</p>
        </div>
      </div>
    </section>
  );

  if (isStaff(user.role)) {
    const where = user.role === "TEACHER" ? { teacherId: user.id } : {};
    const [courses, students, submissions, quizzes] = await Promise.all([
      prisma.course.count({ where }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.submission.count({
        where: { assignment: user.role === "TEACHER" ? { course: { teacherId: user.id } } : {} },
      }),
      prisma.quiz.count({
        where: user.role === "TEACHER" ? { course: { teacherId: user.id } } : {},
      }),
    ]);
    const analytics =
      user.role === "TEACHER" ? await getTeacherAnalytics(user.id) : await getAdminAnalytics();

    const todayDow = now.getDay() === 0 ? 7 : now.getDay();
    const dateIso = todayIso();
    let todayLessons: TodayLesson[] = [];
    if (user.role === "TEACHER") {
      const [entries, teacherCourses, marks] = await Promise.all([
        prisma.scheduleEntry.findMany({
          where: { dayOfWeek: todayDow },
          orderBy: { slot: "asc" },
          include: { group: { select: { name: true } } },
        }),
        prisma.course.findMany({
          where: { teacherId: user.id },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            _count: { select: { enrollments: true } },
          },
        }),
        prisma.attendance.groupBy({
          by: ["courseId"],
          where: { date: dateFromIso(dateIso), course: { teacherId: user.id } },
          _count: { _all: true },
        }),
      ]);

      const teacherName = normalizeTeacherName(user.name);
      const markedByCourse = new Map(marks.map((row) => [row.courseId, row._count._all]));
      const options: CourseOption[] = teacherCourses.map((item) => ({
        slug: item.slug,
        title: item.title,
      }));
      const fallbackSlug = teacherCourses[0]?.slug ?? null;

      todayLessons = entries
        .filter((entry) => entry.teacher && normalizeTeacherName(entry.teacher) === teacherName)
        .map((entry) => {
          const matchedSlug = matchCourseSlug(entry.subject, options);
          const matched = teacherCourses.find((item) => item.slug === matchedSlug) ?? null;
          const slug = matched?.slug ?? fallbackSlug;
          const markedCount = matched ? (markedByCourse.get(matched.id) ?? 0) : 0;
          const total = matched?._count.enrollments ?? 0;
          return {
            id: entry.id,
            slot: entry.slot,
            subject: entry.subject,
            room: entry.room,
            groupName: entry.group.name,
            href: slug
              ? `/courses/${slug}/attendance/lesson?date=${dateIso}&slot=${entry.slot}`
              : null,
            statusText: markedCount > 0 ? `${markedCount}/${total} belgilangan` : "Belgilanmagan",
            marked: markedCount > 0,
          };
        });
    }

    return (
      <>
        {hero}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Kurslar"
            value={courses}
            hint={user.role === "TEACHER" ? "Siz o'qitadigan kurslar" : "Tizimdagi barcha kurslar"}
            icon={
              <Icon>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </Icon>
            }
          />
          <StatTile
            label="Talabalar"
            value={students}
            hint="Tizimdagi talabalar"
            tone="emerald"
            icon={
              <Icon>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </Icon>
            }
          />
          <StatTile
            label="Topshiriqlar"
            value={submissions}
            hint="Yuborilgan ishlar"
            tone="amber"
            icon={
              <Icon>
                <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" />
                <path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
                <path d="m9 13 2 2 4-4" />
              </Icon>
            }
          />
          <StatTile
            label="Testlar"
            value={quizzes}
            hint="Yaratilgan testlar"
            tone="gold"
            icon={
              <Icon>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.8.3-1.3 1-1.3 1.8v.3" />
                <path d="M12 17h.01" />
              </Icon>
            }
          />
        </div>

        {user.role === "TEACHER" ? (
          <Card className="mt-6">
            <CardHeader
              title="Bugungi darslarim"
              subtitle={`${dayName(now.getDay())}, ${fmtDate(now)} — ${todayLessons.length} ta dars`}
            />
            <CardBody className="space-y-2">
              {todayLessons.length === 0 ? (
                <EmptyState
                  title="Bugun dars yo'q"
                  description="Dars jadvalida bugunga sizning darsingiz yo'q."
                />
              ) : (
                todayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-colors duration-150 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex w-24 shrink-0 flex-col rounded-xl bg-brand-50 px-3 py-1.5 text-brand-800">
                        <span className="text-xs font-semibold">{lesson.slot}-par</span>
                        <span className="text-[11px] text-brand-600">
                          {SLOT_TIMES[lesson.slot] ?? ""}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {lesson.subject}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          {lesson.room ? (
                            <>
                              <span className="truncate">{lesson.room}</span>
                              <span className="text-slate-300">·</span>
                            </>
                          ) : null}
                          <span className="truncate">{lesson.groupName}</span>
                        </span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={lesson.marked ? "green" : "slate"}>{lesson.statusText}</Badge>
                      {lesson.href ? (
                        <ButtonLink href={lesson.href} size="sm">
                          Davomat belgilash
                        </ButtonLink>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        ) : null}

        {analytics.kind === "teacher" ? (
          <TeacherAnalyticsSection data={analytics} />
        ) : (
          <AdminAnalyticsSection data={analytics} />
        )}
      </>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: { include: { teacher: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const upcoming = await prisma.assignment.findMany({
    where: { courseId: { in: enrollments.map((e) => e.courseId) } },
    orderBy: { dueAt: "asc" },
    take: 5,
    include: {
      course: true,
      submissions: { where: { studentId: user.id } },
    },
  });

  const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const scheduleToday = user.groupId
    ? await prisma.scheduleEntry.findMany({
        where: { groupId: user.groupId, dayOfWeek: today },
        orderBy: { slot: "asc" },
      })
    : [];

  const analytics = await getStudentAnalytics(user.id);

  return (
    <>
      {hero}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Kurslarim"
          value={enrollments.length}
          hint="Yozilgan kurslar"
          icon={
            <Icon>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </Icon>
          }
        />
        <StatTile
          label="Bugungi darslar"
          value={scheduleToday.length}
          hint={dayName(now.getDay())}
          tone="emerald"
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </Icon>
          }
        />
        <StatTile
          label="Yaqin topshiriqlar"
          value={upcoming.length}
          hint="Muddat bo'yicha"
          tone="amber"
          icon={
            <Icon>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </Icon>
          }
        />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Kurslarim" subtitle={`${enrollments.length} ta kurs`} />
          <CardBody className="space-y-2">
            {enrollments.length === 0 ? (
              <EmptyState
                title="Kurslar yo'q"
                description="Siz hali biror kursga yozilmagansiz."
              />
            ) : (
              enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={`/courses/${e.course.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-card"
                >
                  <span
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: e.course.coverColor }}
                  >
                    {initials(e.course.title)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {e.course.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {e.course.teacher.name}
                    </span>
                  </span>
                  <Icon className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600">
                    <path d="m9 18 6-6-6-6" />
                  </Icon>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Bugungi darslar" subtitle={user.group?.name} />
            <CardBody>
              {scheduleToday.length === 0 ? (
                <EmptyState title="Bugun dars yo'q" description="Dars jadvali bo'sh kun." />
              ) : (
                <ol>
                  {scheduleToday.map((s, index) => (
                    <li
                      key={s.id}
                      className="group flex gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-slate-50"
                    >
                      <span className="w-11 shrink-0 pt-px text-right text-xs font-semibold tabular-nums text-brand-800">
                        {PAIR_TIMES[s.slot] ?? `${s.slot}-para`}
                      </span>
                      <span className="relative flex w-3 shrink-0 justify-center">
                        {index < scheduleToday.length - 1 ? (
                          <span className="absolute top-3 h-full w-px bg-slate-200" />
                        ) : null}
                        <span className="relative z-10 mt-1 size-2.5 rounded-full bg-gold-400 ring-4 ring-gold-300/25 transition-colors duration-150 group-hover:bg-brand-700 group-hover:ring-brand-100" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {s.subject}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Icon className="size-3 shrink-0 text-slate-400">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </Icon>
                          <span className="truncate">{s.room}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">{s.slot}-para</span>
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Yaqin topshiriqlar" subtitle="Muddat bo'yicha" />
            <CardBody className="space-y-2">
              {upcoming.length === 0 ? (
                <EmptyState
                  title="Topshiriqlar yo'q"
                  description="Hozircha faol topshiriq mavjud emas."
                />
              ) : (
                upcoming.map((a) => {
                  const due = a.dueAt ? new Date(a.dueAt) : null;
                  const overdue = Boolean(due && due < now);
                  const soon = Boolean(
                    due && !overdue && due.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000,
                  );
                  const submitted = a.submissions.length > 0;
                  return (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-colors duration-150 hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{a.course.title}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <DateChip overdue={overdue && !submitted} soon={soon && !submitted}>
                          <Icon className="size-3">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </Icon>
                          {fmtDate(a.dueAt)}
                        </DateChip>
                        {submitted ? (
                          <Badge tone="green">Topshirilgan</Badge>
                        ) : overdue ? (
                          <Badge tone="rose">Muddat o&apos;tgan</Badge>
                        ) : soon ? (
                          <Badge tone="amber">Muddat yaqin</Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <StudentAnalyticsSection data={analytics} />
    </>
  );
}
