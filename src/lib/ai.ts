import "server-only";

const API_URL = "https://api.deepseek.com/chat/completions";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export type BugAnalysis = {
  summary: string;
  cause: string;
  fixHint: string;
  severity: string;
};

export async function askAi(
  messages: AiMessage[],
  options?: { timeoutMs?: number; maxTokens?: number },
): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: options?.maxTokens ?? 400,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(options?.timeoutMs ?? 20000),
    });
    if (!response.ok) return null;
    const json = (await response.json().catch(() => null)) as
      | { choices?: { message?: { content?: string } }[] }
      | null;
    const content = json?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch {
    return null;
  }
}

export async function analyzeBug(input: {
  message: string;
  stack?: string | null;
  url?: string | null;
}): Promise<BugAnalysis | null> {
  const reply = await askAi(
    [
      {
        role: "system",
        content:
          "Sen TTPU LMS saytining texnik yordamchisisan. Xatolik haqidagi ma'lumotni tahlil qil va FAQAT JSON qaytar: " +
          '{"summary":"qisqa izoh","cause":"ehtimoliy sabab","fixHint":"tuzatish yo\'l-yo\'riq","severity":"low|medium|high"}. ' +
          "Javob o'zbek tilida va qisqa bo'lsin.",
      },
      {
        role: "user",
        content: `Sahifa: ${input.url ?? "-"}\nXatolik: ${input.message}\nTafsilot: ${(input.stack ?? "").slice(0, 2500)}`,
      },
    ],
    { maxTokens: 350, timeoutMs: 20000 },
  );
  if (!reply) return null;
  try {
    const start = reply.indexOf("{");
    const end = reply.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(reply.slice(start, end + 1)) as Partial<BugAnalysis>;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "Tahlil qilindi",
      cause: typeof parsed.cause === "string" ? parsed.cause : "-",
      fixHint: typeof parsed.fixHint === "string" ? parsed.fixHint : "-",
      severity:
        parsed.severity === "high" || parsed.severity === "low" ? parsed.severity : "medium",
    };
  } catch {
    return null;
  }
}
