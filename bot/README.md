# TTPU LMS Telegram bot

Mustaqil Node skript: long polling, tashqi kutubxonasiz (Node `fetch` + loyihadagi Prisma).

## 1. Bot token olish

1. Telegramda **@BotFather** ga yozing.
2. `/newbot` → bot nomi va username kiriting.
3. BotFather bergan tokenni oling (`123456789:AA...` ko'rinishida).

## 2. Tokenni sozlash

Loyiha ildizidagi `.env` fayliga qo'shing:

```
TELEGRAM_BOT_TOKEN="<tokeningiz>"
```

Yoki har safar qo'lda bering (pastga qarang).

## 3. Ishga tushirish

Loyiha ildizidan:

```bash
node bot/telegram.mjs
```

Tokenni to'g'ridan-to'g'ri berib:

```bash
TELEGRAM_BOT_TOKEN="<tokeningiz>" node bot/telegram.mjs
```

To'xtatish: `Ctrl+C`. Bot long polling bilan ishlaydi, server (Next.js) ishlashi shart emas —
faqat `.env` dagi `DATABASE_URL` manzilida PostgreSQL ishlab turishi kerak.

## Buyruqlar

- `/start` — salomlashish va qisqa qo'llanma
- email yuborish (masalan `ozodbek@ttpu.uz`) — chatni foydalanuvchiga bog'laydi
- `/jadval` — bugungi darslar
- `/ertaga` — ertangi darslar
- `/help` — buyruqlar ro'yxati

## Eslatmalar

- `bot/data.json` — chatId → email bog'lanishlari. Fayl gitga qo'shilmaydi (`.gitignore` da).
- Token yo'q bo'lsa skript aniq xato xabari bilan chiqadi (crash emas).
- Telegram xatolarida bot 5 sekund kutib qayta urinadi.
