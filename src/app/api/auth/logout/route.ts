import { destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  await destroySession();
  return new Response(null, {
    status: 303,
    headers: { Location: new URL("/login", request.url).toString() },
  });
}
