import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { CourseForm } from "@/components/courses/course-form";
import { CourseDeleteButton } from "@/components/courses/course-delete-button";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) notFound();

  const canManage =
    user.role === "ADMIN" || (user.role === "TEACHER" && course.teacherId === user.id);
  if (!canManage) notFound();

  return (
    <>
      <PageHeader
        title="Kursni tahrirlash"
        subtitle={course.title}
        action={<CourseDeleteButton courseId={course.id} courseTitle={course.title} />}
      />
      <CourseForm
        course={{
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          coverColor: course.coverColor,
          isPublished: course.isPublished,
        }}
      />
    </>
  );
}
