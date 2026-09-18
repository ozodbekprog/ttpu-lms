import { notFound } from "next/navigation";
import Link from "next/link";
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
          style={{ background: `linear-gradient(125deg, ${course.coverColor} 0%, #131f3c 90%)` }}
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-20%,rgba(255,255,255,0.18),transparent_48%)]" />
          <span className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full border border-white/10" />
          <span className="pointer-events-none absolute -right-8 -top-14 size-44 rounded-full bg-white/10 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-36 left-1/4 size-80 rounded-full bg-gold-400/10 blur-3xl" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gold-400/90 via-gold-300/30 to-transparent" />
          <div className="relative">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/75 ring-1 ring-inset ring-white/15 backdrop-blur transition-colors duration-150 hover:bg-white/15 hover:text-white"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Kurslar
            </Link>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{course.title}</h1>
                  {!course.isPublished ? (
                    <Badge tone="gold" className="ring-1 ring-inset ring-white/25">
                      Qoralama
                    </Badge>
                  ) : null}
                  {attendance && attendance.total > 0 ? (
                    <Badge tone={attendance.eligible ? "green" : "rose"} className="ring-1 ring-inset ring-white/20">
                      Davomat: {attendance.percent}% {attendance.eligible ? "✓" : "⚠"}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-white/85">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/15 backdrop-blur">
                    <Avatar name={course.teacher.name} className="size-6! text-[9px] ring-1 ring-white/25" />
                    {course.teacher.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/15 backdrop-blur">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/15 backdrop-blur">
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
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                  Tahrirlash
                </ButtonLink>
              ) : null}
            </div>
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
