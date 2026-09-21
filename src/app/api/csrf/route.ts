import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = await generateCsrfToken();
  return Response.json({ ok: true, token });
}