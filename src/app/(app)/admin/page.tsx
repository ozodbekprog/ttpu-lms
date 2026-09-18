import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui";
import { BarChart, DonutChart, LineChart } from "@/components/charts";
import { getAdminCharts } from "@/app/api/admin/charts/data";
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

  return (
    <>
      <PageHeader eyebrow="Boshqaruv" title="Admin panel" subtitle="Tizim statistikasi va boshqaruv" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Foydalanuvchilar" value={users} hint={`${teachers} o'qituvchi, ${students} talaba`} />
        <Stat label="Kurslar" value={courses} hint="Barcha kurslar" />
        <Stat label="Guruhlar" value={groups} hint="Tizimdagi guruhlar" />
        <Stat label="Topshiriqlar" value={submissions} hint="Yuborilgan ishlar" />
        <Stat label="Testlar" value={quizzes} hint="Yaratilgan testlar" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Tezkor havolalar" subtitle="Ko'p ishlatiladigan bo'limlar" />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 transition-all duration-150 hover:border-brand-200 hover:bg-brand-50/60 hover:shadow-sm"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/70 transition-colors duration-150 group-hover:bg-brand-900 group-hover:text-white group-hover:ring-brand-900">
                  {link.icon}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                    {link.title}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{link.description}</span>
                </span>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fayl yuklash" subtitle="png, jpg, webp, pdf, zip, docx, pptx, txt — 20MB gacha" />
          <CardBody>
            <FileUpload />
          </CardBody>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-brand-950">Tahlillar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tizim ko&apos;rsatkichlari va so&apos;nggi 14 kunlik dinamika
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Foydalanuvchilar rollari"
              subtitle="Talabalar, o'qituvchilar va adminlar nisbati"
            />
            <CardBody>
              <DonutChart data={charts.usersByRole} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Topshiriqlar dinamikasi"
              subtitle="So'nggi 14 kunda yuborilgan ishlar soni"
            />
            <CardBody>
              <BarChart data={charts.submissionsByDay} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Davomat ko'rsatkichi"
              subtitle="So'nggi 14 kun: tashrif va sababli holatlar foizi"
            />
            <CardBody>
              <LineChart data={charts.attendanceRateByDay} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Eng faol kurslar"
              subtitle="Ro'yxatdan o'tganlar soni bo'yicha top 5 kurs"
            />
            <CardBody>
              <BarChart data={charts.topCourses} />
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
