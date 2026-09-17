import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CourseForm } from "@/components/courses/course-form";

export default async function NewCoursePage() {
  await requireRole(["TEACHER", "ADMIN"]);

  return (
    <>
      <PageHeader title="Yangi kurs" subtitle="Kurs ma'lumotlarini to'ldiring" />
      <CourseForm />
    </>
  );
}
