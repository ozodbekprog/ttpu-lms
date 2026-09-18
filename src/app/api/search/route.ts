import { getCurrentUser } from "@/lib/auth";
import { searchAll } from "@/components/search/search-data";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const data = await searchAll(user, q);

  return Response.json({ ok: true, data });
}
