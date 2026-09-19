import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await prisma.user.updateMany({
      where: { id: session.uid },
      data: { sessionEpoch: { increment: 1 } },
    });
  }
  await destroySession();
  return new Response(null, {
    status: 303,
    headers: { Location: new URL("/login", request.url).toString() },
  });
}
