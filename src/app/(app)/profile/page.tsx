import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Stat } from "@/components/ui";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileHero } from "@/components/profile/ProfileHero";

export default async function ProfilePage() {
  const user = await requireUser();

  let coursesCount = 0;
  let certificatesCount = 0;
  let thirdLabel = "Ma'lumot";
  let thirdValue: string | number = "—";
  let thirdHint: string | undefined;

  if (user.role === "STUDENT") {
    const [enrollments, certificates, graded] = await Promise.all([
      prisma.enrollment.count({ where: { userId: user.id } }),
      prisma.certificate.count({ where: { studentId: user.id } }),
      prisma.submission.findMany({
        where: { studentId: user.id, status: "GRADED", score: { not: null } },
        select: { score: true, assignment: { select: { maxScore: true } } },
      }),
    ]);
    coursesCount = enrollments;
    certificatesCount = certificates;
    const percents = graded.map((item) =>
      item.assignment.maxScore > 0 ? (item.score ?? 0) / item.assignment.maxScore : 0,
    );
    thirdLabel = "O'rtacha ball";
    thirdValue = percents.length
      ? `${Math.round((percents.reduce((sum, value) => sum + value, 0) / percents.length) * 100)}%`
      : "—";
    thirdHint = percents.length ? `${percents.length} ta baholangan ish` : "Hali baho yo'q";
  } else if (user.role === "TEACHER") {
    const [courses, certificates, students] = await Promise.all([
      prisma.course.count({ where: { teacherId: user.id } }),
      prisma.certificate.count({ where: { issuedById: user.id } }),
      prisma.enrollment.findMany({
        where: { course: { teacherId: user.id } },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);
    coursesCount = courses;
    certificatesCount = certificates;
    thirdLabel = "Talabalar";
    thirdValue = students.length;
    thirdHint = "Kurslariga yozilgan";
  } else {
    const [courses, certificates, users] = await Promise.all([
      prisma.course.count(),
      prisma.certificate.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    coursesCount = courses;
    certificatesCount = certificates;
    thirdLabel = "Foydalanuvchilar";
    thirdValue = users;
    thirdHint = "Faol hisoblar";
  }

  return (
    <>
      <PageHeader eyebrow="Hisob" title="Profil" subtitle="Shaxsiy ma'lumotlar va xavfsizlik" />
      <ProfileHero
        name={user.name}
        email={user.email}
        role={user.role}
        avatarUrl={user.avatarUrl}
        coverUrl={user.coverUrl}
        bio={user.bio}
        createdAt={user.createdAt}
        groupName={user.group?.name ?? null}
        avatar={<AvatarUpload name={user.name} src={user.avatarUrl} />}
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Kurslar" value={coursesCount} />
        <Stat label="Sertifikatlar" value={certificatesCount} />
        <Stat label={thirdLabel} value={thirdValue} hint={thirdHint} />
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <ProfileForm initialName={user.name} initialBio={user.bio} avatarUrl={user.avatarUrl} />
        <PasswordForm />
      </div>
    </>
  );
}
