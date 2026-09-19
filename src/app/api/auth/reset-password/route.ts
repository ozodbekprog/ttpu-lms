import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Parol kamida 8 belgidan iborat bo'lishi kerak" },
      { status: 400 },
    );
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return Response.json(
      { ok: false, error: "Havola yaroqsiz yoki muddati o'tgan" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionEpoch: { increment: 1 } },
    }),
  ]);

  return Response.json({ ok: true });
}
