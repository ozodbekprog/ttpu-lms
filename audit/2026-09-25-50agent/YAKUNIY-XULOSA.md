# YAKUNIY XULOSA — 50-agent audit (tugadi)

- **Audit tugadi:** 2026-09-25 ~18:17 (5 daqiqa jimlik), natijalar **18:23** da yig'ildi.
- **Muhim:** asosiy sessiya yakuniy birlashtirilgan ro'yxat yozmadi (18:01 dan keyin
  yangi xabar chiqmadi) — shuning uchun bu xulosa **51 subagent hisoboti** asosida
  tuzildi. Xom matnlar: `dump-final/`, `FINDINGS-RAW.md`, `FINAL-REPORT.md`.
- Audit davomida sayt bir necha marta qayta deploy qilindi — ba'zi dastlabki
  topilmalar keyin o'z-o'zidan tuzatilib ketdi (quyida holati ko'rsatilgan).

## ✅ Audit o'rtasida/oxirida tuzatilganlar (joriy deploy, 18:25 tekshiruvi)

| Topilma | Holat |
|---|---|
| Demo parol `ttpu1234` HTML/JS'da ochiq | ✅ **yo'q** (endi hech qayerda topilmaydi) |
| CSP `unsafe-eval` | ✅ olib tashlangan (`unsafe-inline` qolgan) |
| `X-Powered-By: Next.js` | ✅ yo'q |
| `/login`, `/register` indekslanishi | ✅ `robots: noindex, nofollow` qo'shilgan |
| Parol placeholder/xabarlari (6 vs 12) | ✅ 12 belgi bo'yicha moslangan |
| Next.js CVE-2026-94545 | ✅ 16.3.6 ga patch (commit `9cc8c6b`) |
| SW precache hardening | ✅ `9cc8c6b` da qilingan |
| Landing mockupdagi shaxsiy ism | ✅ umumiy qilindi (`9cc8c6b`) |

## 🔴 Yangi muhim topilma (audit oxirida)

**Next.js 16.3.5 → CVE-2026-94545 / GHSA-vcvr-r3jv-pc5j** — `next/og`
ImageResponse'da RCE (CVSS 9.5, Critical; ta'sir doirasi `>=16.2.0 <16.3.6`).
Audit paytida versiya mos kelgan, lekin repo allaqachon **16.3.6** ga yangilangan.
Exploitability tasdiqlanmagan (public chunklarda `next/og` topilmagan).

## 🟠 Qolgan ishlar (ustuvorlik bo'yicha)

1. **Kontrast (WCAG AA):** slate-400 matn 2.40–2.63:1; oq/gold-500 2.42:1;
   gold-600 ~3:1 — 4.5:1 talab qilinadi (header, "Yangi" belgilari, CTA, footer).
2. **CSP `unsafe-inline`:** nonce/hash'ga o'tish (inline skriptlar soni 4).
3. **Service Worker:** `no-store`/`private` javoblarni Cache Storage'ga yozmaslik,
   `CACHE_NAME` versiyalash, `activate` da faqat o'z keshini tozalash,
   `Vary: Cookie` hisobga olish.
4. **Himoyalangan sahifalar:** 200 + meta-refresh o'rniga server-side 307/401
   redirect (`/dashboard`, `/admin`, `/profile`, `/settings`).
5. **i18n qoldiqlari:** RU/EN da `<html lang>`, title/description, hardcode
   matnlar — `a159b90` qismini tuzatgan, qayta tekshirish kerak.
6. **Responsiv header:** 320–768px da CTA 2 qatorga bo'linadi; `Kirish`
   `.hidden/.inline-flex` tartibi sabab mobilda yashirilmaydi.
7. **A11y:** skip-link yo'q; hero mockup landmark bo'lib ko'rinadi;
   21 SVG dan 20 tasi `aria-hidden` emas; `section#statistika` heading'siz.
8. **SEO:** canonical, OG/Twitter, structured data yo'q (noindex tuzatildi).
9. **Deploy barqarorligi:** audit paytida asosiy CSS chunk 404, `/login` da
   2 JS chunk 500, `/register` va `/forgot-password` RSC prefetch 502 —
   atomik deploy kerak (eski HTML + yangi hash mos kelmaydi).
10. **Kesh siyosati:** `/` da `s-maxage=31536000` (footgun), `Vary: Cookie` yo'q,
    ETag ~1 daqiqada o'zgaradi, `/api/csrf` da `Vary` to'liq emas.
11. **Demo email/avtomatik to'ldirish:** agar akkauntlar real bo'lsa — olib
    tashlash; sintetik bo'lsa — dokumentatsiya.
12. **Info:** `X-Nextjs-Cache/Prerender/Stale-Time` headerlar, build path
    (`/ROOT/...`) chunklarda, React canary build commit ochiq.

## ✅ Salbiy natijalar (yaxshi tomonlar)

XSS/HTML-injection, SQL injection, upload/download zaifliklari, ochiq
API/admin ma'lumotlari, CORS ochiqligi, source map/secret leak, GraphQL,
open redirect, stack-trace oshkorligi — **topilmadi**. TLS/HSTS/security
headerlar to'g'ri. Rate-limit va auth himoyasi shubhasiz ishlagan
(POST/exploit sinovlari shartsiz o'tkazilmagan).

_Tuzdi: Fariza (opencode), 2026-09-25 18:25._
