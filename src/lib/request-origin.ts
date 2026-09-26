/**
 * So'rovdan tashqi (public) origin ni aniqlaydi.
 *
 * Next.js `next start -H 0.0.0.0` bilan ishga tushirilganda `request.url`
 * bog'lanish manzilini (0.0.0.0) ko'rsatadi — bu QR havolalar va
 * redirectlar uchun yaroqsiz. Shuning uchun avval APP_URL env, keyin
 * proxy/Host sarlavhalari, oxirida `request.url` ishlatiladi.
 */
export function requestOrigin(request: Request): string {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const rawHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = rawHost?.split(",")[0]?.trim();
  if (host && !host.startsWith("0.0.0.0")) {
    const rawProto = request.headers.get("x-forwarded-proto");
    const proto = rawProto?.split(",")[0]?.trim() || "http";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
