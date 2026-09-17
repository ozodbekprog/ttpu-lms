import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/components/courses/course-access";

export type ThreadUser = { id: string; role: Role };

export async function resolveCourseAccess(idOrSlug: string, user: ThreadUser) {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!course) return null;

  const management = canManageCourse(user, course);
  let enrolled = false;
  if (!management) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
    });
    enrolled = Boolean(enrollment);
  }

  return { course, management, enrolled, canView: management || enrolled };
}
