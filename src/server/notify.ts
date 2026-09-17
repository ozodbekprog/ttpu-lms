import "server-only";
import { prisma } from "@/lib/prisma";

type NotifyInput = {
  title: string;
  body?: string;
  link?: string;
};

export async function notifyCourseStudents(courseId: string, input: NotifyInput) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });
    if (enrollments.length === 0) return;

    await prisma.notification.createMany({
      data: enrollments.map((enrollment) => ({
        userId: enrollment.userId,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })),
    });
  } catch {}
}

export async function notifyUser(userId: string, input: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch {}
}
