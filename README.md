# TTPU LMS

Turin Politexnika Universiteti uchun kompakt o'quv boshqaruv tizimi (LMS).
Moodle'ga alternativa: sodda, tez, mobil-qulay.

## Tez boshlash (yangi kompyuterda)

```bash
git clone https://github.com/ozodbekprog/ttpu-lms.git
cd ttpu-lms
bash scripts/setup.sh
npm run dev
```

Setup skripti: kutubxonalar + PostgreSQL (user-space, port 5433) + `.env` + migratsiya + demo ma'lumotlar.

## Demo loginlar (parol: `ttpu1234`)

| Email | Rol |
|---|---|
| admin@ttpu.uz | Administrator |
| n.mahamatov@ttpu.uz | O'qituvchi |
| ozodbek@ttpu.uz | Talaba (AI2-26) |

## Imkoniyatlar

- **Kurslar** — bo'limlar, materiallar (matn, fayl, video, havola)
- **Topshiriqlar** — topshirish, muddat, baholash, feedback
- **Testlar** — 3 xil savol turi, avtomatik baholash, urinishlar
- **Jadval** — haftalik dars jadvali, guruh bo'yicha
- **Davomat** — belgilash va statistika
- **Baholar** — talaba va o'qituvchi jurnali
- **Admin panel** — foydalanuvchilar, guruhlar, kurslar
- **Telegram bot** — jadval va bildirishnomalar

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Prisma 6 · PostgreSQL · jose (JWT) · zod

## Hujjatlar

- `AGENTS.md` — agentlar uchun ishlash qoidalari
- `CONTRACT.md` — API/DB shartnoma va papka egaligi
- `tasks/comp1.md … comp4.md` — kompyuterlar bo'yicha topshiriqlar

## Loyiha tuzilishi

```
src/
  app/
    (auth)/          # login, register
    (app)/           # himoyalangan qism: dashboard, courses, schedule, ...
    api/             # REST API
  components/        # UI kit va modul komponentlari
  lib/               # prisma, auth, utils (muzlatilgan)
prisma/              # schema + seed
bot/                 # Telegram bot (mustaqil)
scripts/             # setup.sh, db.sh
```
