import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/server/notify";
import { buildCuratorReport, getCuratorGroups } from "@/app/api/curator/data";

const sendSchema = z.object({
  groupId: z.string().trim().min(1),
  week: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role === "STUDENT") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "groupId talab qilinadi" }, { status: 400 });
  }

  const allowed = await getCuratorGroups(user, parsed.data.groupId);
  if (allowed.length === 0) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }
  const group = allowed[0];

  const report = await buildCuratorReport(group.id, parsed.data.week ?? null);
  if (!report) {
    return Response.json({ ok: false, error: "Guruh topilmadi" }, { status: 404 });
  }

  const recipientId = group.curator?.id ?? user.id;
  await notifyUser(recipientId, {
    title: `Haftalik hisobot: ${group.name}`,
    body: report.text,
    link: `/curator/${group.id}`,
  });

  return Response.json({
    ok: true,
    data: {
      groupId: group.id,
      sentTo: recipientId,
      week: report.week,
      text: report.text,
    },
  });
}
