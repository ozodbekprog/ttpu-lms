import { getCurrentUser } from "@/lib/auth";
import { buildGroupSummaries, getCuratorGroups } from "@/app/api/curator/data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role === "STUDENT") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const groupId = new URL(request.url).searchParams.get("groupId");
  const groups = await getCuratorGroups(user, groupId);
  const data = await buildGroupSummaries(groups);

  return Response.json({ ok: true, data });
}
