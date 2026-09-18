import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { totalPoints } from "@/components/quiz/shared";
import OrdersManager, {
  type OrderItem,
  type RetakeItem,
} from "@/components/orders/OrdersManager";

const FAIL_PERCENT = 60;

export default async function OrdersPage() {
  const user = await requireUser();

  const [orders, attempts, submissions] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: user.id, finishedAt: { not: null }, score: { not: null } },
      orderBy: { startedAt: "desc" },
      include: {
        quiz: {
          select: {
            title: true,
            course: { select: { title: true } },
            questions: { select: { points: true } },
          },
        },
      },
    }),
    prisma.submission.findMany({
      where: { studentId: user.id, status: "GRADED", score: { not: null } },
      orderBy: { gradedAt: "desc" },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            course: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  const retakes: RetakeItem[] = [];

  for (const attempt of attempts) {
    const max = totalPoints(attempt.quiz.questions);
    const score = attempt.score ?? 0;
    if (max <= 0 || (score / max) * 100 >= FAIL_PERCENT) continue;
    retakes.push({
      id: `quiz-${attempt.id}`,
      kind: "QUIZ",
      title: attempt.quiz.title,
      course: attempt.quiz.course.title,
      score,
      max,
      percent: Math.round((score / max) * 100),
    });
  }

  for (const submission of submissions) {
    const max = submission.assignment.maxScore;
    const score = submission.score ?? 0;
    if (max <= 0 || (score / max) * 100 >= FAIL_PERCENT) continue;
    retakes.push({
      id: `submission-${submission.id}`,
      kind: "ASSIGNMENT",
      title: submission.assignment.title,
      course: submission.assignment.course.title,
      score,
      max,
      percent: Math.round((score / max) * 100),
    });
  }

  retakes.sort((a, b) => a.percent - b.percent);

  const orderItems: OrderItem[] = orders.map((order) => ({
    id: order.id,
    type: order.type,
    subject: order.subject,
    note: order.note,
    status: order.status,
    adminComment: order.adminComment,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Xizmatlar"
        title="Arizalar"
        subtitle="Transkript, ma'lumotnoma va qayta topshirish so'rovlari"
      />
      <OrdersManager orders={orderItems} retakes={retakes} />
    </>
  );
}
