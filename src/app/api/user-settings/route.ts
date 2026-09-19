import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUserPreferences } from "@/components/settings/preferences";

const settingsSchema = z.strictObject({
  reminderBot: z.boolean().optional(),
  reminderHour: z.number().int().min(7).max(10).optional(),
  deadlineReminder: z.boolean().optional(),
  emailNotify: z.boolean().optional(),
  showCharts: z.boolean().optional(),
  scheduleListView: z.boolean().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const preferences = normalizeUserPreferences(user.preferences);
  return Response.json({ ok: true, data: { preferences } });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Sozlamalar ma'lumotlari noto'g'ri" }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return Response.json(
      { ok: false, error: "O'zgartirish uchun maydon yuborilmadi" },
      { status: 400 },
    );
  }

  try {
    const preferences = { ...normalizeUserPreferences(user.preferences), ...parsed.data };
    await prisma.user.update({ where: { id: user.id }, data: { preferences } });
    return Response.json({ ok: true, data: { preferences } });
  } catch {
    return Response.json({ ok: false, error: "Sozlamalarni saqlab bo'lmadi" }, { status: 500 });
  }
}
