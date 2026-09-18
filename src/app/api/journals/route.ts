import { getCurrentUser } from "@/lib/auth";
import { getWeeklyJournals } from "./data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const week = new URL(request.url).searchParams.get("week");
  const data = await getWeeklyJournals(user, week);
  return Response.json({ ok: true, data });
}
