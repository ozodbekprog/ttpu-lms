import { getCurrentUser } from "@/lib/auth";
import { buildTranscript } from "@/components/transcript/transcript-data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const requestedId = new URL(request.url).searchParams.get("studentId")?.trim() || null;

  if (user.role === "STUDENT" && requestedId && requestedId !== user.id) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const studentId = user.role === "STUDENT" ? user.id : requestedId;
  if (!studentId) {
    return Response.json({ ok: false, error: "studentId parametri kerak" }, { status: 400 });
  }

  const data = await buildTranscript(studentId);
  if (!data) {
    return Response.json({ ok: false, error: "Talaba topilmadi" }, { status: 404 });
  }

  return Response.json({ ok: true, data });
}
