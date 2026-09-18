import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateBaseData, getGeneratorStats } from "@/server/generator";

const schema = z.object({
  groups: z.number().int().min(1).max(10).optional(),
  studentsPerGroup: z.number().int().min(4).max(20).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const stats = await getGeneratorStats();
  return Response.json({ ok: true, data: stats });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Parametrlar noto'g'ri" }, { status: 400 });
  }

  const result = await generateBaseData(parsed.data);
  return Response.json({ ok: true, data: result });
}
