import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, ButtonLink, Card, CardBody, PageHeader } from "@/components/ui";
import { cn, fmtDateTime } from "@/lib/utils";
import { canManageCourse } from "@/components/courses/course-access";
import { ForumTopicActions } from "@/components/forum/forum-topic-actions";
import { ForumReplyForm } from "@/components/forum/forum-reply-form";
import { ForumReplyDelete } from "@/components/forum/forum-reply-delete";

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const user = await requireUser();
  const { slug, id } = await params;

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

  const topic = await prisma.forumTopic.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  if (!topic || topic.courseId !== course.id) notFound();

  return (
    <>
      <PageHeader
        title={topic.title}
        subtitle={course.title}
        action={
          <ButtonLink href={`/courses/${course.slug}/forum`} variant="secondary" size="sm">
            Forumga qaytish
          </ButtonLink>
        }
      />

      <Card
        className={cn(
          "relative mb-6 overflow-hidden",
          topic.isPinned ? "border-gold-300/70" : undefined,
        )}
      >
        {topic.isPinned ? <span className="absolute inset-y-0 left-0 w-1 bg-gold-400" /> : null}
        <CardBody className={cn(topic.isPinned && "pl-6")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={topic.author.name} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{topic.author.name}</p>
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
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{fmtDateTime(topic.createdAt)}</p>
              </div>
            </div>
            <ForumTopicActions
              topicId={topic.id}
              isPinned={topic.isPinned}
              canPin={management}
              canDelete={management || topic.author.id === user.id}
              redirectTo={`/courses/${course.slug}/forum`}
            />
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {topic.body}
          </p>
        </CardBody>
      </Card>

      <h2 className="mb-3 flex items-center gap-2 font-semibold text-brand-950">
        Javoblar
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          {topic.replies.length}
        </span>
      </h2>

      {topic.replies.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-6 text-center text-sm text-slate-500">
          Hozircha javoblar yo&apos;q. Birinchi bo&apos;lib javob yozing.
        </p>
      ) : (
        <div className="mb-6 space-y-3">
          {topic.replies.map((reply) => {
            const canDelete = management || reply.author.id === user.id;
            return (
              <Card key={reply.id} className="transition-all duration-200 hover:shadow-lift">
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={reply.author.name} className="size-8! text-[11px]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{reply.author.name}</p>
                        <p className="text-xs text-slate-500">{fmtDateTime(reply.createdAt)}</p>
                      </div>
                    </div>
                    {canDelete ? <ForumReplyDelete replyId={reply.id} /> : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {reply.body}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ForumReplyForm topicId={topic.id} />
    </>
  );
}
