import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { getAdminCharts } from "@/app/api/admin/charts/data";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/admin/FileUpload";

const QUICK_LINKS = [
  {
    href: "/admin/users",
    title: "Foydalanuvchilar",
    description: "Yaratish, tahrirlash, parol tiklash",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/groups",
    title: "Guruhlar",
    description: "Guruhlarni qo'shish va tahrirlash",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 2 9 5-9 5-9-5 9-5" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </svg>
    ),
  },
  {
    href: "/admin/courses",
    title: "Kurslar",
    description: "E'lon qilish, o'qituvchi biriktirish",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/generator",
    title: "Baza generatori",
    description: "MVP uchun demo ma'lumotlar yaratish",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M18.4 5.6l-2.1 2.1M21 12h-3M18.4 18.4l-2.1-2.1M12 18v3M7.8 16.3l-2.2 2.1M3 12h3M7.8 7.7 5.6 5.6" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    ),
  },
  {
    href: "/admin/dictionaries",
    title: "Lug'atlar",
    description: "Fanlar, dars vaqtlari va turlari",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M9 7h7M9 11h7" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    title: "Sozlamalar",
    description: "Modullarni yoqish yoki o'chirish",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const STAT_META = {
  users: {
    bar: "from-brand-900 via-brand-500 to-gold-400",
    bubble: "from-brand-500 to-brand-900 shadow-brand-900/25",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  courses: {
    bar: "from-sky-400 via-brand-500 to-brand-900",
    bubble: "from-sky-400 to-brand-700 shadow-sky-500/25",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  groups: {
    bar: "from-violet-400 via-purple-500 to-brand-800",
    bubble: "from-violet-400 to-purple-700 shadow-purple-500/25",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 2 9 5-9 5-9-5 9-5" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </svg>
    ),
  },
  submissions: {
    bar: "from-emerald-400 via-teal-500 to-brand-800",
    bubble: "from-emerald-400 to-teal-600 shadow-emerald-500/25",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4z" />
      </svg>
    ),
  },
  quizzes: {
    bar: "from-amber-300 via-gold-400 to-gold-600",
    bubble: "from-amber-300 to-gold-500 shadow-gold-500/25",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l2 2 4-4" />
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </svg>
    ),
  },
};

function StatTile({
  meta,
  label,
  value,
  hint,
  delay,
}: {
  meta: keyof typeof STAT_META;
  label: string;
  value: ReactNode;
  hint: ReactNode;
  delay: number;
}) {
  const { bar, bubble, icon } = STAT_META[meta];
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="group relative h-full overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
        <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", bar)} />
        <span
          className={cn(
            "absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br opacity-[0.07] transition-transform duration-300 group-hover:scale-125",
            bubble,
          )}
        />
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-200 group-hover:scale-105",
              bubble,
            )}
          >
            {icon}
          </span>
        </div>
        <p className="relative mt-3 text-3xl font-semibold tabular-nums tracking-tight text-brand-950">{value}</p>
        <p className="relative mt-1 text-xs text-slate-600">{hint}</p>
      </Card>
    </div>
  );
}

export default async function AdminPage() {
  await requireRole(["ADMIN"]);

  const [users, courses, groups, submissions, quizzes, teachers, students, charts] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.group.count(),
      prisma.submission.count(),
      prisma.quiz.count(),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      getAdminCharts(),
    ]);

  const roleTotal = charts.usersByRole.reduce((sum, slice) => sum + slice.value, 0);
  const submissionTotal = charts.submissionsByDay.reduce((sum, point) => sum + point.value, 0);
  const attendanceDays = charts.attendanceRateByDay.filter((point) => point.value > 0);
  const attendanceAvg =
    attendanceDays.length > 0
      ? Math.round(attendanceDays.reduce((sum, point) => sum + point.value, 0) / attendanceDays.length)
      : 0;
  const topCourse = charts.topCourses[0];

  const quickCounts: Record<string, number> = {
    "/admin/users": users,
    "/admin/groups": groups,
    "/admin/courses": courses,
  };

  return (
    <>
      <PageHeader eyebrow="Boshqaruv" title="Admin panel" subtitle="Tizim statistikasi va boshqaruv" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          meta="users"
          label="Foydalanuvchilar"
          value={users}
          hint={`${teachers} o'qituvchi, ${students} talaba`}
          delay={0}
        />
        <StatTile meta="courses" label="Kurslar" value={courses} hint="Barcha kurslar" delay={60} />
        <StatTile meta="groups" label="Guruhlar" value={groups} hint="Tizimdagi guruhlar" delay={120} />
        <StatTile
          meta="submissions"
          label="Topshiriqlar"
          value={submissions}
          hint="Yuborilgan ishlar"
          delay={180}
        />
        <StatTile meta="quizzes" label="Testlar" value={quizzes} hint="Yaratilgan testlar" delay={240} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up transition-shadow duration-200 hover:shadow-lift lg:col-span-2">
          <CardHeader title="Tezkor havolalar" subtitle="Ko'p ishlatiladigan bo'limlar" />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => {
              const count = quickCounts[link.href];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/60 hover:shadow-sm"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/70 transition-all duration-200 group-hover:bg-brand-900 group-hover:text-white group-hover:ring-brand-900">
                    {link.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      {link.title}
                      {typeof count === "number" ? <Badge tone="slate">{count}</Badge> : null}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">{link.description}</span>
                  </span>
                </Link>
              );
            })}
          </CardBody>
        </Card>

        <Card className="animate-fade-up transition-shadow duration-200 hover:shadow-lift">
          <CardHeader title="Fayl yuklash" subtitle="png, jpg, webp, pdf, zip, docx, pptx, txt — 20MB gacha" />
          <CardBody>
            <FileUpload />
          </CardBody>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-brand-950">Tahlillar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tizim ko&apos;rsatkichlari va so&apos;nggi 14 kunlik dinamika
            </p>
          </div>
          <Badge tone="blue">So&apos;nggi 14 kun</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <Card className="h-full transition-shadow duration-200 hover:shadow-lift">
              <CardHeader
                title="Foydalanuvchilar rollari"
                subtitle="Talabalar, o'qituvchilar va adminlar nisbati"
                action={<Badge tone="blue">{roleTotal} ta</Badge>}
              />
              <CardBody>
                <DonutChart data={charts.usersByRole} />
              </CardBody>
            </Card>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <Card className="h-full transition-shadow duration-200 hover:shadow-lift">
              <CardHeader
                title="Topshiriqlar dinamikasi"
                subtitle="So'nggi 14 kunda yuborilgan ishlar soni"
                action={<Badge tone="green">{submissionTotal} ta</Badge>}
              />
              <CardBody>
                <BarChart data={charts.submissionsByDay} />
              </CardBody>
            </Card>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
            <Card className="h-full transition-shadow duration-200 hover:shadow-lift">
              <CardHeader
                title="Davomat ko'rsatkichi"
                subtitle="So'nggi 14 kun: tashrif va sababli holatlar foizi"
                action={<Badge tone={attendanceAvg >= 80 ? "green" : attendanceAvg >= 60 ? "amber" : "rose"}>{attendanceAvg}%</Badge>}
              />
              <CardBody>
                <LineChart data={charts.attendanceRateByDay} />
              </CardBody>
            </Card>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Card className="h-full transition-shadow duration-200 hover:shadow-lift">
              <CardHeader
                title="Eng faol kurslar"
                subtitle="Ro'yxatdan o'tganlar soni bo'yicha top 5 kurs"
                action={topCourse ? <Badge tone="purple">{topCourse.label}</Badge> : null}
              />
              <CardBody>
                <BarChart data={charts.topCourses} />
              </CardBody>
            </Card>
          </div>

          <div className="animate-fade-up lg:col-span-2" style={{ animationDelay: "300ms" }}>
            <Card className="h-full transition-shadow duration-200 hover:shadow-lift">
              <CardHeader
                title="Testlar o'rtacha natijasi"
                subtitle="Eng ko'p topshirilgan testlar bo'yicha o'rtacha foiz"
                action={<Badge tone="gold">{charts.quizAverages.length} ta test</Badge>}
              />
              <CardBody>
                <BarChart data={charts.quizAverages} />
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
