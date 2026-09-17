import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
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
            <Card key={topic.id}>
              <CardBody className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {topic.isPinned ? <Badge tone="amber">Pin</Badge> : null}
                    <Link
                      href={`/courses/${course.slug}/forum/${topic.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {topic.title}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {topic.author.name} · {fmtDateTime(topic.createdAt)} ·{" "}
                    {topic._count.replies} ta javob
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{topic.body}</p>
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
