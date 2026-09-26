# TTPU LMS — 50-agent black-box audit hisoboti

> **Yakuniy xulosa:** audit tugagach `YAKUNIY-XULOSA.md` ham qo'shildi
> (tuzatilganlar + qolgan ishlar ro'yxati). Xom natijalar: `dump-final/`.

- **Sana:** 2026-09-25 (17:06–18:05 UTC+5)
- **Nishon:** `https://ozodbeks-macbook-pro.tail91a187.ts.net:8443`
- **Usul:** opencode 50 parallel subagent (black-box, faqat o'qish; yozmagan/kirmagan)
- **Manba sessiya:** `ses_f2789e24effe3uxiayDo45PFf2` (ryzen-ai7, opencode)
- **Holat:** asosiy 40+ agent yakunlangan; oxirgi ~10 agent (upload/privacy,
  dependency, static injection, cross-route browser, performance, mustaqil
  tekshiruv) hali yakunlanmoqda — `dump/` papkasida ularning joriy natijalari bor.

> ⚠️ Nishon Mac'dagi funnel nusxasi edi. Ba'zi topilmalar hozirgi kodda
> allaqachon tuzatilgan bo'lishi mumkin (masalan `a159b90`, `adf2380` commitlari:
> demo parol, CSP, i18n, skip-link va h.k.) — har birini joriy versiyada qayta
> tekshirish tavsiya etiladi.

---

## 🔴 Kritik / Yuqori

1. **Demo login ma'lumotlari ochiq** — `GET /` HTML footerida
   `ozodbek@ttpu.uz / ttpu1234`; JS chunk (`0eldo20jp3j36.js`) barcha demo
   akkauntlarni (student/teacher/admin) shu parol bilan avtomatik to'ldiradi;
   `/login` da demo tugmalar. Severity: High (agar akkaunt faol bo'lsa).
   *Repro:* `curl -k https://...:8443/ | grep -i demo`

2. **Asosiy CSS chunk 404** — HTML'da ulangan
   `/_next/static/chunks/1gjw0ovuww03r.css` → `404 Not Found` (qolgan CSS/JS 200).
   Deploy paytida chunk hash almashishi (race) tufayli sahifa uslubsiz ochilishi
   mumkin. Severity: High. *Repro:* o'sha CSS URL'ga to'g'ridan-to'g'ri GET.

3. **CSP zaif** — enforced siyosatda
   `script-src 'self' 'unsafe-inline' 'unsafe-eval'`; 4 ta inline skript nonce'siz.
   Report-Only siyosatda esa soxta `'nonce-dynamic'` (real nonce generator emas),
   `report-to` yo'q. Severity: Medium/High (XSS bo'lsa himoya ishlamaydi).

4. **Rang kontrasti WCAG AA'ga yetmaydi** (chromium + piksel tekshiruvi):
   - `#90a1b9` (slate-400) oq/kulrang fonda **2.40–2.63:1** — 19–22 element
     (header-linklar, kunlar, footer matni)
   - oq matn `#c9a227` (gold-500) fonda **2.42:1** — "Hoziroq qo'shilish"
   - `#a9871f` (gold-600) och fonlarda **2.98–3.09:1** — "Yangi" belgilari
   Severity: critical/serious (4.5:1 kerak).

---

## 🟠 O'rta

5. **Himoyalangan sahifalar HTTP redirect o'rniga 200 + meta-refresh** —
   `/dashboard`, `/admin`, `/profile`, `/settings` → 200 shell + JS/meta redirect
   `/login` ga. Ma'lumot chiqmaydi, lekin status kodi noto'g'ri (Informational/Low).

6. **Service Worker `no-store` sahifalarni keshlaydi** — `sw.js` dagi
   `networkFirst()` har qanday `response.ok` ni Cache Storage'ga yozadi
   (faqat `/api/` istisno). `/dashboard` `private, no-store` bo'lsa ham keshlanadi;
   logout/purge yo'q, `Vary: Cookie` yo'q → offline'da boshqa foydalanuvchi
   HTML'i qaytishi mumkin. Severity: Medium.

7. **Lokalizatsiya nomuvofiqliklari** — RU/EN tanlansa ham `<html lang="uz">`,
   `<title>`/`description` o'zbekcha qoladi, `/register` da hardcode o'zbekcha
   matnlar, `/` sahifasida til almashtirgich ishlamaydi, til guruhining
   `aria-label="Language"` lokalizatsiyalanmagan, `hreflang` yo'q, `dir`/RTL yo'q.
   Severity: High/Medium.

8. **Header responsivligi** — 320–768px oralig'ida "Ro'yxatdan o'tish" /
   "Qanday boshlash" 2 qatorga bo'linadi (`white-space: nowrap` yo'q);
   `Kirish` mobilda `.hidden`/`.inline-flex` CSS tartibi sabab yashirilmaydi.
   Severity: Medium/Low.

9. **Keyboard/a11y** — kontent va 19 link to'liq JS hydration'ga bog'liq
   (`<div hidden>`, `<noscript>` yo'q); skip-link yo'q (`main` da `id` yo'q);
   mobil navbat yo'q; hero mockup accessibility daraxtida landmark bo'lib
   ko'rinadi; 21 SVG dan 20 tasi `aria-hidden` emas; `section#statistika`
   heading'siz. Severity: Medium/Low.

10. **404/error UX** — malformed URL (`/%`, `/%zz`) ilova o'rniga xom proxy
    `400 Bad Request` (plain text) qaytaradi; 404 sahifa `<title>` i xato ekanini
    ko'rsatmaydi. Severity: Medium/Low.

11. **SEO/metama'lumot** — `/`, `/login`, `/register` da canonical yo'q,
    auth sahifalarda `noindex` yo'q, description bir xil, OG/Twitter va
    structured data yo'q. Severity: functional/SEO.

---

## 🟡 Past / Info

12. **Parol/validatsiya** — client tomonda max uzunlik yo'q; 12 belgi
    UTF-16 code unit hisoblanadi (6 emoji = 12 → o'tadi); HTML `type=email`
    (`a@b` ok) va JS regex (`.uz` talab qiladi) mos emas; "Ism" `!!` ni qabul
    qiladi; `/register` placeholder "Kamida 6 belgi" ↔ `minLength=12` zid;
    register'dan keyin login yiqilsa "email allaqachon ro'yxatdan o'tgan" deb
    chalg'itadi; reset havola TTL (30 daq) faqat UI matni.

13. **Header/fingerprint** — `X-Powered-By: Next.js`, `X-Nextjs-Cache`,
    `X-Nextjs-Prerender`, `X-Nextjs-Stale-Time`; JS chunkda build path
    `/ROOT/node_modules/...`; `OPTIONS /` → 405 (Allow to'liq emas);
    `/api/attendance/check-in` 405 bo'sh (Allow/Content-Type yo'q).

14. **Kesh siyosati** — `/api/csrf` va auth sahifalarda `Vary: Cookie` yo'q;
    `/` da `s-maxage=31536000` (kelajakdagi user-specific sahifalar uchun xavfli
    footgun); ETag ~1 daqiqada o'zgaradi; CDN yo'q.

15. **Service Worker qo'shimcha** — `activate` barcha origin cache'larini
    o'chiradi (prefiks emas); `CACHE_NAME` qotib qolgan (`ttpu-lms-static-v1`);
    precache `cacheFirst` revalidatsiyasiz.

16. **TLS/transport yaxshi** — HSTS preload, TLS 1.0/1.1 rad etiladi,
    sertifikat to'g'ri; faqat port-80 redirect `:8443` o'rniga 443 ga ketadi;
    audit paytida `robots.txt`/`sitemap.xml`/`security.txt` 502 qaytargan.

17. **Salbiy natijalar (yaxshi):** GraphQL yo'q; source map/secret leak yo'q;
    CORS ochilmagan; rate-limit javoblarida xato/stack-trace yo'q;
    tashqi uchinchi tomon resurslari yo'q; SQL/HTML injection belgisi yo'q;
    admin API'lar 401/404; `security.txt` dan tashqari barcha endpoint'lar ok.

---

## Fayllar

- `FINDINGS-RAW.md` — 51 subagentning to'liq xom javoblari (rus tilida, dalillar).
- `dump/` — har bir subagent sessiyasining alohida matni (`00-MAIN.txt` — asosiy).
- `audit-dump.tgz` — hammasi bitta arxivda.

_Tayyorlandi: Fariza (opencode), 2026-09-25._
