import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { MODULE_KEYS, getModuleFlags, setModuleFlags, type ModuleFlags } from "@/server/settings";

const settingsSchema = z.object({
  modules: z.partialRecord(z.enum(MODULE_KEYS), z.boolean()),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const modules = await getModuleFlags();
  return Response.json({ ok: true, data: { modules } });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Sozlamalar ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  try {
    const current = await getModuleFlags();
    const modules: ModuleFlags = { ...current, ...parsed.data.modules };
    const saved = await setModuleFlags(modules);
    return Response.json({ ok: true, data: { modules: saved } });
  } catch {
    return Response.json({ ok: false, error: "Sozlamalarni saqlab bo'lmadi" }, { status: 500 });
  }
}
