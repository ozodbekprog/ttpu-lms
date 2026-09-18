import { getCurrentUser } from "@/lib/auth";
import { getStaffExams, getStudentExams } from "@/components/exams/data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "STUDENT") {
    const groups = await getStudentExams(user.id);
    return Response.json({ ok: true, data: { role: user.role, groups } });
  }

  const groups = await getStaffExams({ id: user.id, role: user.role });
  return Response.json({ ok: true, data: { role: user.role, groups } });
}
