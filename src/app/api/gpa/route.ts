import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentGpa } from "./data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "STUDENT") {
    const data = await getStudentGpa(user.id);
    return Response.json({ ok: true, data });
  }

  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return Response.json({ ok: false, error: "studentId talab qilinadi" }, { status: 400 });
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });
  if (!student || student.role !== "STUDENT") {
    return Response.json({ ok: false, error: "Talaba topilmadi" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    const data = await getStudentGpa(studentId);
    return Response.json({ ok: true, data });
  }

  const ownedCourses = await prisma.course.findMany({
    where: { teacherId: user.id, enrollments: { some: { userId: studentId } } },
    select: { id: true },
  });
  if (ownedCourses.length === 0) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const data = await getStudentGpa(
    studentId,
    ownedCourses.map((course) => course.id),
  );
  return Response.json({ ok: true, data });
}
