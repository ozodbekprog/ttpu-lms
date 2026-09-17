import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui";
import FileUpload from "@/components/admin/FileUpload";

const QUICK_LINKS = [
  {
    href: "/admin/users",
    title: "Foydalanuvchilar",
    description: "Yaratish, tahrirlash, parol tiklash",
  },
  {
    href: "/admin/groups",
    title: "Guruhlar",
    description: "Guruhlarni qo'shish va tahrirlash",
  },
  {
    href: "/admin/courses",
    title: "Kurslar",
    description: "E'lon qilish, o'qituvchi biriktirish, o'chirish",
  },
];

export default async function AdminPage() {
  await requireRole(["ADMIN"]);

  const [users, courses, groups, submissions, quizzes, teachers, students] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.group.count(),
    prisma.submission.count(),
    prisma.quiz.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ]);

  return (
    <>
      <PageHeader title="Admin panel" subtitle="Tizim statistikasi va boshqaruv" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Foydalanuvchilar" value={users} hint={`${teachers} o'qituvchi, ${students} talaba`} />
        <Stat label="Kurslar" value={courses} />
        <Stat label="Guruhlar" value={groups} />
        <Stat label="Topshiriqlar" value={submissions} />
        <Stat label="Testlar" value={quizzes} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tezkor havolalar" />
          <CardBody className="space-y-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="block text-sm font-medium text-slate-900">{link.title}</span>
                <span className="block text-xs text-slate-500">{link.description}</span>
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
    </>
  );
}
