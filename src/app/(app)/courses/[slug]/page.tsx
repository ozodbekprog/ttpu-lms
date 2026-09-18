import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, ButtonLink } from "@/components/ui";
import { CourseMaterials } from "@/components/courses/course-materials";
import { CourseReviews } from "@/components/courses/course-reviews";
import { CourseStudents } from "@/components/courses/course-students";
import { CourseTabs } from "@/components/forum/course-tabs";
import { getCourseAttendance } from "@/app/api/attendance/summary/data";

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
  const materialsCount = course.sections.reduce((sum, section) => sum + section.materials.length, 0);
  const attendance = !canManage && isEnrolled ? await getCourseAttendance(course.id, user.id) : null;

  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/70 shadow-card">
        <div
          className="relative px-6 py-7 text-white md:px-8 md:py-9"
          style={{ background: `linear-gradient(115deg, ${course.coverColor}, #131f3c 92%)` }}
        >
          <span className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-white/10 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Kurs</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{course.title}</h1>
                {!course.isPublished ? <Badge tone="gold">Qoralama</Badge> : null}
                {attendance && attendance.total > 0 ? (
                  <Badge tone={attendance.eligible ? "green" : "rose"}>
                    Davomat: {attendance.percent}% {attendance.eligible ? "✓" : "⚠"}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                <span className="inline-flex items-center gap-2">
                  <Avatar name={course.teacher.name} className="size-7! text-[10px] ring-2 ring-white/20" />
                  {course.teacher.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/70"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  {materialsCount} ta material
                </span>
                {canManage ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/70"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {course.enrollments.length} ta talaba
                  </span>
                ) : null}
              </div>
              {course.description ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                  {course.description}
                </p>
              ) : null}
            </div>
            {canManage ? (
              <ButtonLink
                href={`/courses/${course.slug}/edit`}
                variant="gold"
                size="sm"
                className="shrink-0"
              >
                Tahrirlash
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      <CourseTabs slug={course.slug} active={activeTab} canManage={canManage} />

      {activeTab === "students" ? (
        <CourseStudents enrollments={course.enrollments} />
      ) : (
        <CourseMaterials courseId={course.id} sections={course.sections} canManage={canManage} />
      )}

      {canManage || isEnrolled ? (
        <div className="mt-6">
          <CourseReviews courseId={course.id} isEnrolled={isEnrolled} canManage={canManage} />
        </div>
      ) : null}
    </>
  );
}
