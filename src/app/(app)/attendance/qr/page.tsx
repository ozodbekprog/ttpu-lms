import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader } from "@/components/ui";
import { StaffQrHub } from "@/components/attendance/staff-qr-hub";
import { getModuleFlags } from "@/server/settings";

export default async function AttendanceQrPage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    redirect("/attendance/check-in");
  }

  const flags = await getModuleFlags();

  if (!flags.qr_attendance) {
    return (
      <>
        <PageHeader
          eyebrow="Davomat"
          title="QR davomat"
          subtitle="Kursni tanlab sessiya boshlang"
        />
        <EmptyState
          title="QR davomat o'chirilgan"
          description="Bu modul administrator tomonidan vaqtincha o'chirilgan. Yoqish uchun administratorga murojaat qiling."
        />
      </>
    );
  }

  const courses = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { title: "asc" },
  });

  const rows = courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    isPublished: course.isPublished,
    students: course._count.enrollments,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Davomat"
        title="QR davomat"
        subtitle="Kursni tanlab sessiya boshlang"
      />
      <StaffQrHub courses={rows} />
    </>
  );
}
