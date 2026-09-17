import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CourseMaterials } from "@/components/courses/course-materials";
import { CourseStudents } from "@/components/courses/course-students";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { tab } = await searchParams;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      teacher: { select: { id: true, name: true } },
      sections: {
        orderBy: { position: "asc" },
        include: { materials: { orderBy: { position: "asc" } } },
      },
      enrollments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              group: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const canManage =
    user.role === "ADMIN" || (user.role === "TEACHER" && course.teacherId === user.id);
  const isEnrolled = course.enrollments.some((e) => e.user.id === user.id);
  if (!canManage && !course.isPublished && !isEnrolled) notFound();

  const activeTab = tab === "students" && canManage ? "students" : "materials";

  const tabs = [
    { href: `/courses/${slug}`, label: "Materiallar", active: activeTab === "materials" },
    { href: `/courses/${slug}/assignments`, label: "Topshiriqlar", active: false },
    { href: `/courses/${slug}/attendance`, label: "Davomat", active: false },
    { href: `/courses/${slug}/announcements`, label: "E'lonlar", active: false },
    { href: `/courses/${slug}/forum`, label: "Forum", active: false },
    ...(canManage
      ? [{ href: `/courses/${slug}?tab=students`, label: "Talabalar", active: activeTab === "students" }]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span
              className="inline-block size-4 shrink-0 rounded"
              style={{ backgroundColor: course.coverColor }}
            />
            {course.title}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{course.teacher.name}</span>
            {!course.isPublished ? <Badge tone="amber">Qoralama</Badge> : null}
          </span>
        }
        action={
          canManage ? (
            <ButtonLink href={`/courses/${course.slug}/edit`} variant="secondary">
              Tahrirlash
            </ButtonLink>
          ) : undefined
        }
      />

      {course.description ? (
        <p className="mb-6 max-w-3xl text-sm text-slate-600">{course.description}</p>
      ) : null}

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition",
              t.active
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "students" ? (
        <CourseStudents enrollments={course.enrollments} />
      ) : (
        <CourseMaterials courseId={course.id} sections={course.sections} canManage={canManage} />
      )}
    </>
  );
}
