import { getCurrentUser } from "@/lib/auth";
import { buildCuratorReport, getCuratorGroups } from "@/app/api/curator/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role === "STUDENT") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const groupId = params.get("groupId");
  if (!groupId) {
    return Response.json({ ok: false, error: "groupId talab qilinadi" }, { status: 400 });
  }

  const allowed = await getCuratorGroups(user, groupId);
  if (allowed.length === 0) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  const data = await buildCuratorReport(groupId, params.get("week"));
  if (!data) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  return Response.json({ ok: true, data });
}
