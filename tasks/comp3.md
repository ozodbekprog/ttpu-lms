# Komp 3 — Testlar (quiz), jadval, Telegram bot

**Branch:** `feat/comp3-quiz-schedule`
**Egali papkalar:** CONTRACT.md §4 (quizzes, schedule, bot).

## Vazifalar

### P0 — Dars jadvali
1. `/schedule` sahifasi: haftalik jadval (6 kun × 8 par), guruh tanlash (default — o'z guruhi).
2. O'qituvchi/admin: jadval yozuvlarini qo'shish/tahrirlash/o'chirish.
3. Bugungi darslar ajralib turishi (highlight).
4. Seed'dagi AI2-26 jadvali bilan mos ishlashi.

### P0 — Testlar
5. O'qituvchi: test yaratish (`/quizzes/new`): savollar — SINGLE (bitta to'g'ri), MULTIPLE (bir nechta), TEXT (qo'lda baholanadi).
6. Savollar CRUD, test `isPublished`, `timeLimitMin`, `maxAttempts`.
7. Talaba: testlar ro'yxati → testni boshlash (`POST /api/quizzes/[id]/attempts`) → javob berish → topshirish (`PATCH /api/attempts/[id]`).
8. Avtomatik baholash: SINGLE/MULTIPLE to'liq mos kelsa ball; TEXT — qo'lda (o'qituvchi baholaydi).
9. `maxAttempts` cheklovi; vaqt tugasa avtomatik submit (client timer).
10. **Muhim:** talabaga yuboriladigan JSON'da `correct` javoblar BO'LMASLIGI shart.
11. Natijalar: talaba — o'z urinishlari; o'qituvchi — barcha urinishlar + TEXT javoblarni baholash.

### P1 — Telegram bot
12. `bot/telegram.mjs` — mustaqil skript (long polling, kutubxonasiz yoki oddiy fetch):
    - `/start` — ro'yxatdan o'tish (email orqali bog'lash, ixtiyoriy)
    - `/jadval` — bugungi darslar (guruh bo'yicha)
    - `TELEGRAM_BOT_TOKEN` env orqali
13. `bot/README.md` — ishga tushirish yo'riqnomasi.

## API lar
CONTRACT.md §5 (Komp 3 ro'yxati).

## Tekshirish
- `npm run build` yashil.
- Demo quiz "Test 1" seed'da bor — talaba sifatida ishlab ko'rish.
- Schedule sahifasida AI2-26 jadvali ko'rinadi.
