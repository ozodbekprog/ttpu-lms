# STATUS — qurilish holati

Oxirgi yangilanish: To'lqin 2 + xavfsizlik tuzatishlari (Komp 1)

## Kompyuterlar

| Komp | Topshiriq | Holat |
|---|---|---|
| 1 | Orchestrator, integratsiya, review nazorati | 🟢 |
| 2 | Kurslar, topshiriqlar, baholar, davomat | 🟢 |
| 3 | Testlar, jadval, Telegram bot | 🟢 |
| 4 | Admin panel, upload, bildirishnomalar, dizayn | 🟢 |

## To'lqin 2 da qo'shildi

- [x] Telegram bot (`bot/telegram.mjs`) — `/start`, `/jadval`, `/ertaga`, email bog'lash
- [x] Profil sahifasi + parol almashtirish
- [x] Avtomatik bildirishnomalar (material, topshiriq, test publish, baho)
- [x] Loading skeletonlar, error boundary, 404 sahifalar
- [x] Seed boyitildi (idempotent): baholar, davomat tarixi, 2-test, bildirishnomalar

## Xavfsizlik tuzatishlari (review asosida)

- [x] Server-side quiz timer (vaqt tugasa urinish yopiladi)
- [x] Aralash testda avtomatik baholash (SINGLE/MULTIPLE)
- [x] Kurs a'zolar PII faqat manager'larga
- [x] Quiz ro'yxati IDOR yopildi (enrollment kesish)
- [x] URL sxema validatsiyasi (http/https yoki /uploads/)
- [x] Upload: hajm pre-check, magic bytes, staff-only
- [x] Xavfsizlik headerlari (CSP, nosniff, XFO, HSTS)
- [x] Jadval egaligi (teacher faqat o'z yozuvlari) + parity konflikti
- [x] Admin lockout himoyasi (oxirgi admin/o'zini himoya)
- [x] Login/register rate limit + timing tenglashtirish + parol min 8
- [x] Seed production himoyasi
- [x] Results API (`GET /api/quizzes/[id]/results`)

## Ma'lum cheklovlar (keyingi bosqich)

- [ ] Sessiyani bekor qilish (sessionEpoch) — schema o'zgarishi kerak
- [ ] Testlar (Vitest) hali yo'q
- [ ] Schedule UI: boshqa o'qituvchi tugmani bossa 403 xabar ko'radi (UI yashirish keyin)
- [ ] Rate limit in-memory (restartda tozalanadi) — Redis keyin

## Holat: `main` yashil — build o'tadi, dev server ishlaydi
