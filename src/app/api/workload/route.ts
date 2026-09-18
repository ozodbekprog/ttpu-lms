import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { buildWorkloadData } from "@/components/workload/workload-data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const raw = new URL(request.url).searchParams.get("teacherId");
  const parsed = z.string().trim().min(1).safeParse(raw);
  if (raw !== null && !parsed.success) {
    return Response.json({ ok: false, error: "teacherId noto'g'ri" }, { status: 400 });
  }
  const requested = parsed.success ? parsed.data : null;

  if (user.role === "TEACHER" && requested && requested !== user.id) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const data = await buildWorkloadData({
    teacherId: user.role === "TEACHER" ? user.id : requested,
    includeAllTeachers: user.role === "ADMIN",
  });

  if (requested && !data.teachers.some((teacher) => teacher.id === requested)) {
    return Response.json({ ok: false, error: "O'qituvchi topilmadi" }, { status: 404 });
  }

  return Response.json({ ok: true, data });
}
