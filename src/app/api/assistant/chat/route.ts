import { z } from "zod";
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

  const reply = await askAi(
    [
      {
        role: "system",
        content:
          `Sen "AI yordamchi" — TTPU LMS saytining mehribon yordamchisisan. Vaziyat: ${situation}\n` +
          "Qoidalar:\n" +
          "- O'zbek tilida, qisqa (2-3 gap), samimiy va xotirjam yoz.\n" +
          "- Hech qachon texnik tafsilot (stack trace, kod, IP, server nomi, fayl yo'li) aytma.\n" +
          "- Foydalanuvchini tinchlantir va nima qilayotganini so'ra.\n" +
          "- Muammoni adminga yuborishni taklif qil (buni sayt o'zi tugma orqali qiladi).\n" +
          "- Boshqa foydalanuvchilar haqida hech narsa aytma.\n" +
          "- Vazifangdan tashqari mavzularga o'tma.",
      },
      ...parsed.data.messages,
    ],
    { maxTokens: 250, timeoutMs: 25000 },
  );

  if (!reply) {
    return Response.json(
      {
        ok: true,
        data: {
          reply:
            "Rahmat! Tafsilotlarni adminga yuborishni taklif qilaman — pastdagi tugma orqali yuborishingiz mumkin.",
          fallback: true,
        },
      },
      { status: 200 },
    );
  }

  return Response.json({ ok: true, data: { reply } });
}
