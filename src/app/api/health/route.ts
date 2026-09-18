import { prisma } from "@/lib/prisma";

export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  const data = {
    status: db ? "healthy" : "unhealthy",
    db,
    time: new Date().toISOString(),
  };

  return Response.json({ ok: db, data }, { status: db ? 200 : 503 });
}
