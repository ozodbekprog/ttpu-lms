import { getCurrentUser } from "@/lib/auth";
import { getAdminCharts } from "./data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const data = await getAdminCharts();
  return Response.json({ ok: true, data });
}
