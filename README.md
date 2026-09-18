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

## Deploy

Lokal production ishga tushirish:

```bash
bash scripts/deploy.sh
```

Skript PostgreSQL'ni ishga tushiradi (`scripts/db.sh`), `npm run build` qiladi, serverni fon rejimida
ko'taradi (`nohup`, log — `/tmp/ttpu-prod.log`, pid — `/tmp/ttpu-prod.pid`) va
`http://localhost:3000/api/health` orqali holatni tekshiradi. Health javobida `db: true` bo'lmasa —
log oxirini ko'rsatib xato bilan to'xtaydi.

`.env` talablari:

| O'zgaruvchi | Tavsif |
|---|---|
| `DATABASE_URL` | PostgreSQL manzili (port 5433) |
| `AUTH_SECRET` | JWT sessiya kaliti (`openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot tokeni (@BotFather orqali olinadi) |

Tunnel / VPS:

- Quick tunnel: `TUNNEL=1 bash scripts/deploy.sh` — cloudflared mavjudligini tekshiradi va ko'rsatma chop etadi (tunnelni o'zi ishga tushirmaydi).
- Tashqi kirish uchun: `cloudflared tunnel --url http://localhost:3000` yoki VPS'da nginx + TLS.

Bot ishga tushirish:

```bash
node bot/telegram.mjs
```

Bot long polling bilan ishlaydi; `TELEGRAM_BOT_TOKEN` loyiha ildizidagi `.env` dan o'qiladi.

## Hujjatlar

- `AGENTS.md` — agentlar uchun ishlash qoidalari
- `CONTRACT.md` — API/DB shartnoma va papka egaligi
- `TEAM-TASKS.md` — **jamoa uchun topshiriqlar taqsimoti** (T01–T15, agent promptlari bilan)
- `STATUS.md` — joriy holat va qolgan ishlar
- `tasks/comp1.md … comp4.md` — kompyuterlar bo'yicha topshiriqlar (arxiv)

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
scripts/             # setup.sh, db.sh, deploy.sh
```
