# ONBOARDING.md — Jamoaga qo'shilish va repo'da ishlash

Bu qo'llanma TTPU LMS ustida ishlaydigan har bir jamoa a'zosi uchun.
5 qadamda ishni boshlasa bo'ladi.

---

## 1-qadam: GitHub'ga kirish

1. Repo egasi sizni taklif qilgan bo'ladi (`ozodbekprog/ttpu-lms` — private repo).
2. To'g'ri akkauntga kirilgan holda shu havolani oching:
   **https://github.com/ozodbekprog/ttpu-lms/invitations**
3. **"Accept invitation"** tugmasini bosing.
4. Qabul bo'lgach repo ko'rinadi: https://github.com/ozodbekprog/ttpu-lms

## 2-qadam: Kompyuterni tayyorlash

Kerakli dasturlar:

| Dastur | Versiya | Izoh |
|---|---|---|
| Git | oxirgi | `git --version` |
| Node.js | **22+** | `node -v` |
| PostgreSQL | 15+ | `psql --version` (server paketi bilan) |

Windows bo'lsa — **WSL** (Ubuntu) orqali qiling. Mac/Linux to'g'ridan-to'g'ri.

## 3-qadam: Loyihani o'rnatish (1 marta)

```bash
# GitHub'dan clone (o'z akkauntingiz bilan)
git clone https://github.com/ozodbekprog/ttpu-lms.git
cd ttpu-lms

# Hammasi avtomatik: npm install + PostgreSQL (5433-port, user-space)
# + .env + migratsiyalar + demo ma'lumotlar
bash scripts/setup.sh

# Ishga tushirish
npm run dev
# → http://localhost:3000  (login: admin@ttpu.uz / ttpu1234)
```

Muammo bo'lsa:
- `Can't reach database server` → `bash scripts/db.sh` (bazani ko'taradi)
- Login 429 (rate limit) → boshqa `X-Forwarded-For` yoki 10 daqiqa kuting
- `.env` yo'q → `bash scripts/setup.sh` qayta ishlating

## 4-qadam: AI agent bilan ishlash

1. AI agentni (opencode/Claude) **repo papkasida** oching.
2. Agentga birinchi xabar:
   > "AGENTS.md, CONTRACT.md va TEAM-TASKS.md ni o'qi. T<raqam> vazifasini boshlamoqchiman."
3. **Muhim qoidalar (agentga ham ayt):**
   - `AGENTS.md` — ishlash qoidalari; `CONTRACT.md` — API va papka egaligi
   - Muzlatilgan fayllar: `prisma/schema.prisma`, `src/lib/**`, `src/components/ui.tsx`,
     layout'lar — **tegilmaydi** (kerak bo'lsa PRda izoh bilan so'raladi)
   - Faqat o'z vazifangiz fayllarida ishlang
   - Oxirida: `npx tsc --noEmit` va `npm run build` yashil bo'lishi shart

## 5-qadam: Ish jarayoni (har kuni)

```bash
# 1. Eng yangi kodni olish
git checkout main
git pull --rebase origin main

# 2. O'z branch'ingiz (TEAM-TASKS.md dagi ID bilan)
git checkout -b feat/T07-exam-sessions

# 3. Agent bilan ishlash...
#    (tekshiruv: npx tsc --noEmit && npm run build)

# 4. Commit + push
git add -A
git commit -m "T07: imtihon sessiyalari moduli"
git push -u origin HEAD

# 5. Pull Request ochish (shablon avtomatik chiqadi)
gh pr create --title "T07: Imtihon sessiyalari" --body-file - <<< "TEAM-TASKS.md dagi T07 DoD bajarildi. tsc+build yashil."
```

- PR'ni repo egasi review qilib **merge** qiladi (main'ga to'g'ridan-to'g'ri push qilinmaydi).
- Har PRda **CI** ishlaydi (build + tsc) — qizil bo'lsa merge bo'lmaydi.
- Merge'dan keyin branch avtomatik o'chadi.

## Vazifalar taqsimoti

Barcha vazifalar `TEAM-TASKS.md` da: T01–T15, 6 ta Lane (yo'nalish):

| Lane | Mavzular |
|---|---|
| A | Xavfsizlik: sessiya, rate-limit, audit |
| B | Testlar: Vitest, Playwright, CI |
| C | Auth: parol tiklash, email/telegram bildirishnomalar |
| D | Modullar: imtihonlar, savollar banki, kichik guruhlar, xonalar |
| E | Platforma: i18n, PWA, CSV import |
| F | Ops: VPS deploy, kurator paneli |

Har vazifada tayyor **agent prompti** bor — nusxa olib agentga bering.

## Aloqa

- Savol/blok: STATUS.md "Bloklovchi muammolar" bo'limiga yozing yoki Telegram guruhda so'rang
- Haftalik sync: Telegram — nima merge bo'ldi, kim nimaga tiqildi
