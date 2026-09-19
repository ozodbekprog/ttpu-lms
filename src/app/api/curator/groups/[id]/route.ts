import { getCurrentUser } from "@/lib/auth";
import { buildGroupDetail, getCuratorGroups } from "@/app/api/curator/data";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role === "STUDENT") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const allowed = await getCuratorGroups(user, id);
  if (allowed.length === 0) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  const data = await buildGroupDetail(id);
  if (!data) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  return Response.json({ ok: true, data });
}
