import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { cn, fmtDateTime } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { CourseTabs } from "@/components/forum/course-tabs";
import { ForumTopicCreate } from "@/components/forum/forum-topic-create";
import { ForumTopicActions } from "@/components/forum/forum-topic-actions";

export default async function CourseForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) notFound();

  const management = canManageCourse(user, course);
  if (user.role === "STUDENT") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
    });
    if (!enrolled) notFound();
  } else if (!management) {
    notFound();
  }

  const topics = await prisma.forumTopic.findMany({
    where: { courseId: course.id },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { replies: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Forum"
        subtitle={course.title}
        action={
          <ButtonLink href={`/courses/${course.slug}`} variant="secondary" size="sm">
            Kurs sahifasi
          </ButtonLink>
        }
      />
      <CourseTabs slug={course.slug} active="forum" canManage={management} />

      <ForumTopicCreate courseId={course.id} />

      {topics.length === 0 ? (
        <EmptyState
          title="Mavzular yo'q"
          description="Birinchi savol yoki muhokamani boshlang."
        />
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className={cn(
                "relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
                topic.isPinned ? "border-gold-300/70" : undefined,
              )}
            >
              {topic.isPinned ? <span className="absolute inset-y-0 left-0 w-1 bg-gold-400" /> : null}
              <CardBody className={cn("flex flex-wrap items-start justify-between gap-4", topic.isPinned && "pl-6")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.isPinned ? (
                      <Badge tone="gold">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1"
                        >
                          <path d="M12 17v5" />
                          <path d="M9 10.8V4h6v6.8l2 2.2H7z" />
                        </svg>
                        Pin
                      </Badge>
                    ) : null}
                    <Link
                      href={`/courses/${course.slug}/forum/${topic.id}`}
                      className="font-semibold text-slate-900 transition-colors duration-150 hover:text-brand-700"
                    >
                      {topic.title}
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <Avatar name={topic.author.name} className="size-5! text-[9px]" />
                    <span>{topic.author.name}</span>
                    <span className="text-slate-500">·</span>
                    <span>{fmtDateTime(topic.createdAt)}</span>
                    <span className="text-slate-500">·</span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {topic._count.replies} javob
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {topic.body}
                  </p>
                </div>
                <ForumTopicActions
                  topicId={topic.id}
                  isPinned={topic.isPinned}
                  canPin={management}
                  canDelete={management || topic.author.id === user.id}
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
