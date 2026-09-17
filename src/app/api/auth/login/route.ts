import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Email va parolni to'g'ri kiriting" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!user || !user.isActive) {
    return Response.json({ ok: false, error: "Email yoki parol xato" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return Response.json({ ok: false, error: "Email yoki parol xato" }, { status: 401 });
  }

  await createSession(user);
  return Response.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role },
  });
}
