import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { QuizEditor } from "@/components/quiz/quiz-editor";

export default async function NewQuizPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const courses = await prisma.course.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.id } : {},
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <PageHeader
        title="Yangi test"
        subtitle="Ma'lumotlarni to'ldiring va savollarni qo'shing"
      />
      <QuizEditor courses={courses} />
    </>
  );
}
