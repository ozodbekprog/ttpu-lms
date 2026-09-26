import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyCsrfFromRequest } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { askAi } from "@/lib/ai";
import { friendlyBugLine } from "@/components/bugs/bug-utils";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(12),
  context: z
    .object({
      url: z.string().trim().max(600).optional(),
      errorMessage: z.string().trim().max(2000).optional(),
    })
    .optional(),
});

const SLOT_TIMES: Record<number, string> = {
  1: "09:00-10:20",
  2: "10:30-11:50",
  3: "12:00-13:20",
  4: "14:20-15:40",
  5: "15:50-17:10",
  6: "17:20-18:40",
  7: "18:50-20:10",
  8: "20:20-21:40",
};

async function buildUserContext(user: {
  id: string;
  name: string;
  role: string;
  groupId: string | null;
}): Promise<string> {
  const lines: string[] = [];
  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();

  if (user.role === "STUDENT") {
    const [enrollments, group, lessons, attendance] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: { course: { select: { title: true, slug: true } } },
        take: 10,
      }),
      user.groupId
        ? prisma.group.findUnique({ where: { id: user.groupId }, select: { name: true } })
        : Promise.resolve(null),
      user.groupId
        ? prisma.scheduleEntry.findMany({
            where: { groupId: user.groupId, dayOfWeek: todayDow },
            orderBy: { slot: "asc" },
            take: 10,
          })
        : Promise.resolve([]),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { studentId: user.id },
        _count: { _all: true },
      }),
    ]);
    lines.push(`Guruh: ${group?.name ?? "-"}`);
    lines.push(
      `Kurslarim: ${enrollments.map((item) => item.course.title).join(", ") || "-"}`,
    );
    lines.push(
      `Bugungi darslarim: ${
        lessons
          .map(
            (lesson) =>
              `${lesson.slot}-par ${lesson.subject}${lesson.room ? ` (${lesson.room})` : ""} ${SLOT_TIMES[lesson.slot] ?? ""}`,
          )
          .join("; ") || "bugun dars yo'q"
      }`,
    );
    lines.push(
      `Davomat yakuni: ${
        attendance.map((row) => `${row.status}: ${row._count._all}`).join(", ") || "yozuvlar yo'q"
      }`,
    );
  } else {
    const [courses, lessons] = await Promise.all([
      prisma.course.findMany({
        where: user.role === "TEACHER" ? { teacherId: user.id } : {},
        select: { title: true },
        take: 12,
      }),
      user.role === "TEACHER"
        ? prisma.scheduleEntry.findMany({
            where: { teacherId: user.id, dayOfWeek: todayDow },
            orderBy: { slot: "asc" },
            take: 10,
            include: { group: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);
    lines.push(`O'qitadigan kurslarim: ${courses.map((course) => course.title).join(", ") || "-"}`);
    lines.push(
      `Bugungi darslarim: ${
        lessons
          .map(
            (lesson) =>
              `${lesson.slot}-par ${lesson.subject} ${lesson.group?.name ?? ""} ${SLOT_TIMES[lesson.slot] ?? ""}`,
          )
          .join("; ") || "bugun dars yo'q"
      }`,
    );
  }

  return lines.join("\n");
}

function availablePages(role: string) {
  const base = [
    { path: "/dashboard", title: "Dashboard" },
    { path: "/courses", title: "Kurslar" },
    { path: "/schedule", title: "Jadval" },
    { path: "/grades", title: role === "STUDENT" ? "Baholarim" : "Baholash" },
    { path: "/exams", title: "Imtihonlar" },
    { path: "/messages", title: "Xabarlar" },
    { path: "/profile", title: "Profil" },
    { path: "/settings", title: "Sozlamalar" },
    { path: "/help", title: "Yordam" },
  ];
  const staff = [
    { path: "/journal", title: "Jurnal" },
    { path: "/reports", title: "Hisobotlar" },
    { path: "/rooms", title: "Xonalar" },
    { path: "/bookings", title: "Xona broni" },
    { path: "/curator", title: "Kurator paneli" },
    { path: "/workload", title: "Yuklama" },
  ];
  const student = [
    { path: "/attendance", title: "Davomat" },
    { path: "/gpa", title: "GPA" },
    { path: "/transcript", title: "Transkript" },
    { path: "/certificates", title: "Sertifikatlar" },
    { path: "/orders", title: "Arizalar" },
  ];
  const admin =
    role === "ADMIN"
      ? [
          { path: "/admin", title: "Admin panel" },
          { path: "/admin/users", title: "Foydalanuvchilar" },
          { path: "/admin/groups", title: "Guruhlar" },
          { path: "/admin/bugs", title: "Xatoliklar" },
        ]
      : [];
  return [...base, ...(role === "STUDENT" ? student : staff), ...admin];
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await verifyCsrfFromRequest(request))) {
    return Response.json({ ok: false, error: "CSRF token yaroqsiz" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Xabar formati noto'g'ri" }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(`ai:${user.id}`, {
    windowMs: 60 * 60 * 1000,
    maxAttempts: 60,
    keyPrefix: "ai",
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { ok: false, error: "Juda ko'p murojaat. Birozdan so'ng urinib ko'ring." },
      { status: 429 },
    );
  }

  const situation = parsed.data.context?.errorMessage
    ? `Sahifada kutilmagan holat yuz berdi (${friendlyBugLine(parsed.data.context.errorMessage)}). Sahifa: ${parsed.data.context.url ?? "-"}.`
    : "Foydalanuvchi o'zi murojaat qildi.";

  const pages = availablePages(user.role);
  const pageList = pages.map((page) => `${page.path} — ${page.title}`).join("\n");
  const userContext = await buildUserContext({
    id: user.id,
    name: user.name,
    role: user.role,
    groupId: user.groupId,
  });

  const reply = await askAi(
    [
      {
        role: "system",
        content:
          `Sen "AI yordamchi" — TTPU LMS saytining aqlli yordamchisisan.\n` +
          `Foydalanuvchi: ${user.name} (${user.role}). Vaziyat: ${situation}\n\n` +
          `FOYDALANUVCHI MA'LUMOTLARI (faqat shu foydalanuvchiga tegishli — boshqalarniki emas):\n${userContext}\n\n` +
          "Qoidalar:\n" +
          "- O'zbek tilida, qisqa (2-4 gap), samimiy yoz.\n" +
          "- Faqat yuqoridagi ma'lumotlardan va saytning umumiy imkoniyatlaridan foydalan. Boshqa foydalanuvchilarning ma'lumotlarini hech qachon aytma.\n" +
          "- Ma'lumot yetarli bo'lmasa — qaysi sahifada ko'rish mumkinligini ayt.\n" +
          "- Sahifa ochish kerak bo'lsa, javob oxirida ALOHIDA qatorda aynan shunday yoz: [[NAV:/courses|Kurslar]]\n" +
          `  Ruxsat etilgan sahifalar:\n${pageList}\n` +
          "- 'Ochdim' deb yozma — tizim o'zi ochadi.\n" +
          "- Jadval, davomat, topshiriqlar bo'yicha aniq qadam-baqadam maslahat ber.\n" +
          "- Texnik tafsilotlar (kod, server, IP, fayl yo'li) — aytma.\n" +
          "- Faqat shu foydalanuvchining o'z ma'lumotlari haqida gapiradi, boshqalar haqida so'ralsa — 'bu faqat administrator uchun' deb ayt.",
      },
      ...parsed.data.messages,
    ],
    { maxTokens: 350, timeoutMs: 25000 },
  );

  if (!reply) {
    return Response.json(
      {
        ok: true,
        data: {
          reply:
            "Hozir javob bera olmadim. Birozdan so'ng qayta yozing yoki '📤 Muammoni adminga yuborish' tugmasini bosing.",
          actions: [],
          fallback: true,
        },
      },
      { status: 200 },
    );
  }

  const actions: { type: string; path: string; title: string }[] = [];
  const cleanReply = reply
    .replace(/\[\[NAV:([^\]|]*)\|?([^\]]*)\]\]/g, (_match, rawPath: string, rawTitle: string) => {
      const path = rawPath.trim();
      const title = rawTitle.trim();
      if (pages.some((page) => page.path === path)) {
        actions.push({ type: "navigate", path, title: title || path });
      }
      return "";
    })
    .trim();

  return Response.json({ ok: true, data: { reply: cleanReply, actions } });
}
