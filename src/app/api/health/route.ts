import { prisma } from "@/lib/prisma";

function isInternalRequest(request: Request): boolean {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const internalIps = [
    "127.0.0.1",
    "::1",
    "localhost",
  ];

  const internalRanges = [
    "10.",
    "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
    "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
    "192.168.",
  ];

  if (internalIps.includes(clientIp)) return true;
  return internalRanges.some(range => clientIp.startsWith(range));
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && !isInternalRequest(request)) {
    return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  }

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