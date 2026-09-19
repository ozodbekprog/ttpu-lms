import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { QuestionBankManager } from "@/components/question-bank/manager";

export default async function QuestionBankPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);

  const courses = await prisma.course.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.id } : {},
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const subjects =
    user.role === "ADMIN"
      ? await prisma.subject.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : (
          await prisma.teacherSubject.findMany({
            where: { teacherId: user.id },
            orderBy: { subject: { name: "asc" } },
            select: { subject: { select: { id: true, name: true } } },
          })
        ).map((item) => item.subject);

  return (
    <>
      <PageHeader
        title="Savollar banki"
        subtitle="Kurs va fanlar bo'yicha savollarni saqlang, filtrlang va testlarga qo'shing"
      />
      <QuestionBankManager courses={courses} subjects={subjects} />
    </>
  );
}
