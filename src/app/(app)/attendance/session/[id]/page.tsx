import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/components/courses/course-access";
import { QrStage } from "@/components/attendance/qr-stage";

export default async function AttendanceSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, slug: true, title: true, teacherId: true } },
    },
  });
  if (!session) notFound();
  if (!canManageCourse(user, session.course)) notFound();

  return (
    <QrStage
      sessionId={session.id}
      initialCode={session.code}
      courseSlug={session.course.slug}
      courseTitle={session.course.title}
      expiresAt={session.expiresAt.toISOString()}
      createdAt={session.createdAt.toISOString()}
    />
  );
}
