import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { verifyCsrfFromRequest } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { askAiWithTools } from "@/lib/ai";
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

  const basePages = [
    { path: "/dashboard", title: "Dashboard" },
    { path: "/courses", title: "Kurslar" },
    { path: "/schedule", title: "Jadval" },
    { path: "/grades", title: user.role === "STUDENT" ? "Baholarim" : "Baholash" },
    { path: "/exams", title: "Imtihonlar" },
    { path: "/messages", title: "Xabarlar" },
    { path: "/profile", title: "Profil" },
    { path: "/settings", title: "Sozlamalar" },
    { path: "/help", title: "Yordam" },
  ];
  const staffPages = [
    { path: "/journal", title: "Jurnal" },
    { path: "/reports", title: "Hisobotlar" },
    { path: "/rooms", title: "Xonalar" },
    { path: "/bookings", title: "Xona broni" },
    { path: "/curator", title: "Kurator paneli" },
    { path: "/workload", title: "Yuklama" },
  ];
  const studentPages = [
    { path: "/attendance", title: "Davomat" },
    { path: "/gpa", title: "GPA" },
    { path: "/transcript", title: "Transkript" },
    { path: "/certificates", title: "Sertifikatlar" },
    { path: "/orders", title: "Arizalar" },
  ];
  const adminPages =
    user.role === "ADMIN"
      ? [
          { path: "/admin", title: "Admin panel" },
          { path: "/admin/users", title: "Foydalanuvchilar" },
          { path: "/admin/groups", title: "Guruhlar" },
          { path: "/admin/bugs", title: "Xatoliklar" },
          { path: "/admin/settings", title: "Sozlamalar" },
        ]
      : [];
  const pages = [
    ...basePages,
    ...(user.role === "STUDENT" ? studentPages : staffPages),
    ...adminPages,
  ];
  const pageList = pages.map((page) => `${page.path} — ${page.title}`).join("\n");

  const tools = [
    {
      type: "function" as const,
      function: {
        name: "navigate",
        description:
          "Sayt ichidagi sahifani ochish. Foydalanuvchi biror bo'limni ko'rsatishni so'raganda ishlatiladi.",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              enum: pages.map((page) => page.path),
              description: "Ochiladigan sahifa manzili",
            },
            title: { type: "string", description: "Sahifa nomi (o'zbekcha)" },
          },
          required: ["path"],
        },
      },
    },
  ];

  const result = await askAiWithTools(
    [
      {
        role: "system",
        content:
          `Sen "AI yordamchi" — TTPU LMS saytining aqlli yordamchisisan. Foydalanuvchi: ${user.name} (${user.role}). Vaziyat: ${situation}\n` +
          "Qoidalar:\n" +
          "- O'zbek tilida, qisqa (2-3 gap), samimiy yoz.\n" +
          "- Bo'lim ochishni yoki biror sahifaga o'tishni so'rashsa — navigate funksiyasini chaqir va qisqa izoh ber.\n" +
          "- Jadval/darslar, davomat, topshiriqlar bo'yicha aniq qadam-baqadam ko'rsatma ber (qaysi sahifada nima bosish kerak).\n" +
          "- Hech qachon texnik tafsilot (kod, server, IP, fayl yo'li) aytma.\n" +
          "- Boshqa foydalanuvchilar haqida gapirma.\n" +
          "- Faqat quyidagi sahifalarga yo'naltir:\n" +
          pageList,
      },
      ...parsed.data.messages,
    ],
    tools,
    { maxTokens: 320, timeoutMs: 25000 },
  );

  if (!result) {
    return Response.json(
      {
        ok: true,
        data: {
          reply:
            "Rahmat! Hozir javob bera olmadim — birozdan so'ng qayta yozing yoki '📤 Muammoni adminga yuborish' tugmasini bosing.",
          actions: [],
          fallback: true,
        },
      },
      { status: 200 },
    );
  }

  const actions = result.toolCalls
    .filter((call) => call.name === "navigate")
    .map((call) => ({
      type: "navigate",
      path: typeof call.args.path === "string" ? call.args.path : "",
      title: typeof call.args.title === "string" ? call.args.title : "",
    }))
    .filter((action) => pages.some((page) => page.path === action.path));

  return Response.json({ ok: true, data: { reply: result.content ?? "", actions } });
}
