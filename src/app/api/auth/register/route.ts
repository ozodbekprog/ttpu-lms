import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Ma'lumotlar to'liq emas (parol kamida 6 belgi)" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return Response.json({ ok: false, error: "Bu email allaqachon ro'yxatdan o'tgan" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { name: parsed.data.name.trim(), email, passwordHash, role: "STUDENT" },
  });

  await createSession(user);
  return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
}
