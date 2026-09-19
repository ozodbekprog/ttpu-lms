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

## VPS (doimiy deploy)

Ubuntu 24.04 server: Node 22 + PostgreSQL (tizim) + Caddy (avtomatik HTTPS) + systemd.
Fayllar: `deploy/Caddyfile`, `deploy/ttpu-lms.service`, `deploy/ttpu-bot.service`.

### 1. DNS

Domen registratorida A-yozuv: `lms.ttpu.uz` → VPS IP. Serverda 80 va 443 portlar ochiq bo'lsin
(masalan `ufw allow 80,443/tcp`).

### 2. Birinchi o'rnatish

```bash
ssh root@VPS_IP
git clone https://github.com/ozodbekprog/ttpu-lms.git /opt/ttpu-lms
sudo bash /opt/ttpu-lms/scripts/deploy-prod.sh
```

Skript hammasini bajaradi: apt (Node 22, PostgreSQL, Caddy, git, rsync), `ttpu` user,
`.env` generatsiyasi (`DATABASE_URL`, `AUTH_SECRET`) + DB role/baza, `npm ci`,
`prisma generate`, `prisma migrate deploy`, `npm run build`, systemd unitlar (`enable`),
Caddyfile o'rnatish va `http://localhost:3000/api/health` tekshiruvi.

Variantlar:

- Boshqa domen: `DOMAIN=lms.example.uz sudo -E bash scripts/deploy-prod.sh`
- Repo o'rniga lokal papkadan rsync: `SRC_DIR=/path/ttpu-lms sudo -E bash scripts/deploy-prod.sh`

### 3. `.env`

| O'zgaruvchi | Tavsif |
|---|---|
| `DATABASE_URL` | `postgresql://ttpu:PAROL@localhost:5432/ttpu_lms?schema=public` (skript yaratadi) |
| `AUTH_SECRET` | JWT kaliti (`openssl rand -hex 32`, skript yaratadi) |
| `TELEGRAM_BOT_TOKEN` | @BotFather tokeni (bot uchun shart) |
| `APP_URL` | `https://lms.ttpu.uz` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email yuborish uchun (T03/T13) |

Fayl: `/opt/ttpu-lms/.env` (egasi `ttpu`, huquq 0600). Tahrirdan keyin:
`sudo systemctl restart ttp u-lms ttp u-bot`.

### 4. Qayta deploy

```bash
sudo bash /opt/ttpu-lms/scripts/deploy-prod.sh
```

Ichida: `git pull` → `npm ci` → `prisma migrate deploy` → `npm run build` → servislar restart.
Qo'lda ekvivalenti: `git pull && npm ci && npx prisma migrate deploy && npm run build && sudo systemctl restart ttp u-lms ttp u-bot`.

### 5. Backup va restore

Kunlik backup (pg_dump → gzip → 7 kunlik rotation):

```bash
sudo bash /opt/ttpu-lms/scripts/backup.sh
```

Natija: `~/backups/ttpu-lms-YYYY-MM-DD-HHMM.sql.gz` (root uchun `/root/backups`).

Cron taklifi:

```bash
echo '0 3 * * * /opt/ttpu-lms/scripts/backup.sh >> /var/log/ttpu-backup.log 2>&1' | sudo tee /etc/cron.d/ttpu-backup
sudo chmod 644 /etc/cron.d/ttpu-backup
```

Restore:

```bash
sudo systemctl stop ttp u-lms
sudo -u postgres dropdb --if-exists ttpu_lms
sudo -u postgres createdb -O ttp u ttpu_lms
gunzip -c /root/backups/ttpu-lms-YYYY-MM-DD-HHMM.sql.gz | sudo -u postgres psql ttpu_lms
sudo systemctl start ttp u-lms
```

Dump `--clean --if-exists` bilan olingan, shuning uchun mavjud bazaga ham tiklash mumkin.

### 6. Tekshiruv

```bash
systemctl status ttp u-lms ttp u-bot caddy
journalctl -u ttp u-lms -n 50 --no-pager
curl -fsS https://lms.ttpu.uz/api/health
```

Health javobi: `{"ok":true,"data":{"status":"healthy","db":true,...}}`. `enable` qilingani uchun
rebootdan keyin servislar o'zi ko'tariladi.

## Hujjatlar

- `ONBOARDING.md` — **jamoaga qo'shilish: 5 qadamda ishni boshlash**
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
scripts/             # setup.sh, db.sh, deploy.sh, deploy-prod.sh, backup.sh
deploy/              # Caddyfile + systemd unitlar (VPS deploy)
```
