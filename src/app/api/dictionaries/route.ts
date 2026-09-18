import { getCurrentUser } from "@/lib/auth";
import { ensureDictionaryDefaults, listDictionaries } from "./data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await ensureDictionaryDefaults();
  const data = await listDictionaries();

  return Response.json({ ok: true, data });
}
