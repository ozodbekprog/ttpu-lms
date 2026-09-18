# TEAM-TASKS.md — Jamoa uchun topshiriqlar taqsimoti

> Bu fayl jamoa a'zolari va ularning AI agentlari uchun. Har bir "Lane" (yo'nalish)
> mustaqil ishlashi mumkin — fayl hududlari to'qnashmaydi.

## 0. Umumiy ma'lumot

- **Repo:** https://github.com/ozodbekprog/ttpu-lms
- **Jonli sayt (vaqtinchalik):** https://text-unlock-initially-where.trycloudflare.com
- **Demo loginlar:** `ozodbek@ttpu.uz`, `n.mahamatov@ttpu.uz`, `admin@ttpu.uz` — parol `ttpu1234`
- **Stack:** Next.js 16 + Prisma 6 + PostgreSQL + Tailwind v4 + jose (JWT) + zod
- **Hujjatlar:** `AGENTS.md` (qoidalar), `CONTRACT.md` (API/papka egaligi), `STATUS.md` (holat)

### Majburiy qoidalar (AI agentlar uchun ham)

1. Har ish boshlashdan oldin **AGENTS.md** va **CONTRACT.md** ni o'qish.
2. **Muzlatilgan fayllar** (faqat Komp 1 / repo egasi o'zgartiradi — PRda so'rov qoldiring):
   `prisma/schema.prisma`, `src/lib/**`, `src/components/ui.tsx`,
   `src/app/(app)/layout.tsx`, `src/app/layout.tsx`, `src/app/globals.css`.
   Schema o'zgarishi kerak bo'lsa — PR tavsifida aniq yozing (model, maydonlar).
3. API formati: `{ ok: true, data }` / `{ ok: false, error }`; zod validatsiya; rol tekshiruvi.
4. Kodda izoh yozilmaydi, `any` ishlatilmaydi. Matnlar o'zbekcha, kod inglizcha.
5. Har PR oldidan: `npx tsc --noEmit` va `npm run build` yashil bo'lishi shart.
6. Yangi foydalanuvchi moduli qo'shilsa — `src/server/settings.ts` dagi `MODULE_KEYS` ga qo'shish
   va nav'da `getModuleFlags()` bilan filtrga tushirish (Komp 1 bilan kelishilgan).
7. Test/yaroqsiz ma'lumotlar bazada qoldirilmaydi (yoki `db:reset` bilan tiklanadi).

### Git ish tartibi

```bash
git clone https://github.com/ozodbekprog/ttpu-lms.git && cd ttpu-lms
bash scripts/setup.sh                 # baza + .env + demo ma'lumotlar
npm run dev                           # http://localhost:3000

git checkout -b feat/T01-session-epoch
# ... agent bilan ishlash ...
npx tsc --noEmit && npm run build
git pull --rebase origin main
git push -u origin HEAD
gh pr create --title "T01: Sessiya bekor qilish" --body "Maqsad: ... DoD: ..."
```

- Branch nomi: `feat/T<ID>-<qisqa-nom>` (masalan `feat/T07-exam-sessions`).
- Har kuni `git pull --rebase origin main` (jamoa bir vaqtda ishlaydi).
- PR'ni repo egasi review qilib merge qiladi; `STATUS.md` shu PRda yangilanadi.

### Agent prompt namunasi (har bir topshiriq uchun)

```
Sen TTPU LMS loyihasida ishlaysan. Repo: <yo'l>.
Avval AGENTS.md, CONTRACT.md va TEAM-TASKS.md dagi T<ID> kartasini o'qi.
Faqat o'z fayl hududingda ishla. tsc + build yashil bo'lsin.
```

---

## 1. Vazifalar jadvali

| ID | Vazifa | Prioritet | Lane | Branch |
|----|--------|-----------|------|--------|
| T01 | Sessiyani bekor qilish (sessionEpoch) | P0 | A — Xavfsizlik | `feat/T01-session-epoch` |
| T02 | Vitest testlar (authz, autoScore, davomat, GPA) + CI | P0 | B — Testlar | `feat/T02-vitest` |
| T03 | Parolni tiklash (forgot/reset) + email tasdiqlash | P0 | C — Auth | `feat/T03-password-reset` |
| T04 | Rate-limit Redis + audit log | P1 | A — Xavfsizlik | `feat/T04-redis-audit` |
| T05 | i18n: uz / ru / en | P1 | E — UX | `feat/T05-i18n` |
| T06 | PWA (o'rnatiladigan ilova, offline shell) | P1 | E — UX | `feat/T06-pwa` |
| T07 | Imtihon sessiyasi moduli | P1 | D — Modullar | `feat/T07-exam-sessions` |
| T08 | Savollar banki + random variantlar | P1 | D — Modullar | `feat/T08-question-bank` |
| T09 | Kichik guruhlar (subgroups A/B) | P1 | D — Modullar | `feat/T09-subgroups` |
| T10 | Xona bandligi (rooms usage) | P1 | D — Modullar | `feat/T10-rooms-usage` |
| T11 | Kurator/Dekan paneli + haftalik hisobot | P1 | F — Data/Ops | `feat/T11-dean-panel` |
| T12 | CSV import/eksport (talabalar, guruhlar, fanlar) | P1 | E — UX | `feat/T12-csv-import` |
| T13 | Email + Telegram bildirishnoma kanallari | P2 | C — Auth | `feat/T13-notify-channels` |
| T14 | VPS deploy: domen, HTTPS, systemd, backup | P0 | F — Ops | `feat/T14-vps-deploy` |
| T15 | E2E testlar (Playwright) | P2 | B — Testlar | `feat/T15-e2e` |

---

## 2. Task kartalari

### T01 — Sessiyani bekor qilish (sessionEpoch) · P0 · Lane A

**Muammo:** JWT 7 kun amal qiladi; logout/parol o'zgarishi eski tokenlarni o'ldirmaydi.
**Yechim:** `User.sessionEpoch Int @default(0)` maydoni (schema — Komp 1 dan so'raladi);
JWT payloadga `epoch` qo'shiladi; `getCurrentUser()` da solishtiriladi; logout va parol
o'zgarishida epoch oshiriladi.
**Hudud:** `src/app/api/auth/**`, `src/api/profile/**`, `src/components/profile/**`
**DoD:** eski token logout/parol almashgandan keyin 401 beradi; login/register ishlaydi; tsc+build yashil.

```
Agent prompti: "T01 ni bajar: User.sessionEpoch (schema o'zgarishi — PRda aniq yoz),
JWT da epoch, getCurrentUser tekshiruvi, logout/parol o'zgarishida inkrement.
Hudud: api/auth, api/profile, components/profile. Eski token 401 bo'lsin. tsc+build."
```

### T02 — Vitest testlar · P0 · Lane B

**Yechim:** Vitest + `@vitest/coverage`; testlar: (a) authz matritsasi (talaba → admin API 403,
begona o'qituvchi → 403), (b) test avtomatik baholash (SINGLE/MULTIPLE/TEXT aralash),
(c) davomat 80% qoidasi (`attendanceCounts`), (d) GPA 4.0 hisobi, (e) schedule konflikt.
**Hudud:** YANGI `tests/**`, `vitest.config.ts`, `package.json` scripts (`test`, `test:run`).
CI: GitHub Actions `.github/workflows/ci.yml` (tsc + test + build).
**DoD:** `npm run test:run` yashil; CI PRlarda ishlaydi.

```
Agent prompti: "T02: Vitest o'rnat, tests/ da authz+autoScore+attendance+GPA testlar,
npm run test:run va CI workflow. Mavjud kodni O'ZGARTIRMA, faqat test fayllari + config."
```

### T03 — Parolni tiklash + email tasdiqlash · P0 · Lane C

**Yechim:** `PasswordResetToken` modeli (token hash, expiresAt) yoki imzolangan link;
`/forgot-password`, `/reset-password` sahifalari; email yuborish `src/server/mailer.ts`
(SMTP env: `SMTP_HOST/PORT/USER/PASS`). Email tasdiqlash: `emailVerifiedAt` + token link.
**Hudud:** `src/app/(auth)/forgot-password/**`, `reset-password/**`, `src/app/api/auth/**`,
`src/server/mailer.ts`.
**DoD:** token 30 daqiqa amal qiladi, bir martalik, parol yangilanadi, epoch oshadi (T01 bilan);
email tasdiqlash ixtiyoriy — feature flag (`MODULE_KEYS` emas, env: `EMAIL_VERIFICATION=1`).

```
Agent prompti: "T03: parol tiklash oqimi (token hash, 30 daqiqa, bir martalik),
mailer.ts (SMTP env), sahifalar, API. Token muddati/ishlatilishi test qilinadi."
```

### T04 — Rate-limit Redis + audit log · P1 · Lane A

**Yechim:** `ioredis` yoki `redis` klient; login/register/chat limitlari Rediska;
`AuditLog` modeli (`actorId, action, entity, entityId, meta, createdAt`) — muhim amallar
(o'chirish, baholash, status, login muvaffaqiyatli). Admin ko'rish sahifasi `/admin/audit`.
**DoD:** restart limitni tozalamaydi; audit sahifasi filtrlaydi; tsc+build yashil.

### T05 — i18n uz/ru/en · P1 · Lane E

**Yechim:** `next-intl` yoki yengil custom dictionary (`src/i18n/{uz,ru,en}.ts`) + cookie `locale`;
sahifalar matnlarini bosqichma-bosqich ko'chirish (avval nav + auth + dashboard).
**DoD:** til almashtirgich (topbar), tanlov cookie'da saqlanadi; asosiy 10 sahifa tarjima.

### T06 — PWA · P1 · Lane E

**Yechim:** `manifest.webmanifest`, ikonkalar (logo asosida), service worker (offline shell,
statik keshlash), `next-pwa` yoki qo'lda SW; "Ilovani o'rnatish" banneri.
**DoD:** Chrome/Firefox'da "Install" chiqadi; offline sahifa ishlaydi; Lighthouse PWA pass.

### T07 — Imtihon sessiyasi moduli · P1 · Lane D

**Yechim:** `ExamSession` (courseId, date, startTime, endTime, room, type, admissionOpen),
`ExamSheet` (sessionId, studentId, seat?, status) modellari (Komp 1 schema PR);
sessiyalar CRUD (academic/kurator/admin), talabaga "Mening imtihonlarim" (ruxsat 80% bilan),
davomat/qatnashuv belgilash sahifasi, natijalar.
**Hudud:** `src/app/(app)/exams/**`, `src/app/api/exams/**`, `src/components/exams/**` (kengaytirish).
**DoD:** sessiya → ro'yxat → natija oqimi; begona rol 403; tsc+build.

### T08 — Savollar banki + random variantlar · P1 · Lane D

**Yechim:** `QuestionBank` (courseId, subject/topic, difficulty, text, type, options, correct);
test yaratishda bankdan tanlash; har talabaga savollarni random aralashtirish (attempt
yaratilganda `order` saqlanadi yoki seed bilan deterministik).
**Hudud:** `src/components/quiz/**`, `src/app/api/quizzes/**` (kengaytirish), yangi bank API.
**DoD:** bankdan test tuzish, variantlar har talabaga farqli, javoblar sizib chiqmaydi.

### T09 — Kichik guruhlar (subgroups) · P1 · Lane D

**Yechim:** `SubGroup` (groupId, name A/B/C) + `User.subGroupId?`; jadval yozuvlarida
`subGroup String?`; davomat va jurnalda sub-guruh bo'yicha ko'rinish; builder'da tanlash.
**DoD:** bir guruh 2 ta kichik guruhga bo'linadi; jadval/davomat filtri; eski ma'lumot buzilmaydi.

### T10 — Xona bandligi (rooms usage) · P1 · Lane D

**Yechim:** `/rooms` ga "Bandlik" ko'rinishi: xona × hafta setkasi (jadval + bronlar birlashtirilgan),
bo'sh slotni topish, jadval bilan konfliktni bron yaratishda tekshirish.
**Hudud:** `src/app/(app)/rooms/**`, `src/app/api/rooms/**`, `src/components/rooms/**` + bookings integratsiya.
**DoD:** band slot ko'rinadi; bron jadvaldagi dars bilan to'qnashsa 409 sabab bilan.

### T11 — Kurator/Dekan paneli · P1 · Lane F

**Yechim:** yangi rol yoki ADMIN bo'limi: guruhlar bo'yicha davomat/baho nazorati,
"muammoli talabalar" (davomat <80%, qarzlar), haftalik hisobotni Telegramga yuborish
(bot orqali kuratorga). `DEAN` roli (Role enum — Komp 1 orqali) yoki `?scope=dean` sahifalar.
**DoD:** guruh → talaba drill-down; hisobot botga boradi; rol tekshiruvlari.

### T12 — CSV import/eksport · P1 · Lane E

**Yechim:** import: talabalar (ism, email, guruh), guruhlar, fanlar — CSV yuklash, xato
qatorlar hisobot; eksport: mavjud CSV'lar (baholar/davomat) bilan bir format.
**Hudud:** `/admin/import` sahifasi + `src/app/api/admin/import/**`.
**DoD:** 100+ qatorli CSV xatosiz import; dublikatlar skip; natija hisoboti.

### T13 — Email + Telegram bildirishnoma kanallari · P2 · Lane C

**Yechim:** bildirishnomalar `Notification` yozuvi bilan birga email (SMTP) va bot orqali
(chatId bog'langan bo'lsa) yuboriladi; `/settings` dagi preferencelar hurmat qilinadi;
`src/server/mailer.ts` (T03 bilan umumiy).
**DoD:** material/topshiriq/baho xabarlari tanlangan kanallarga boradi; spam yo'q (bir marta).

### T14 — VPS deploy: domen, HTTPS, systemd, backup · P0 · Lane F

**Yechim:** Ubuntu VPS + Node 22 + PostgreSQL (tizim) + Caddy (HTTPS) + systemd unit
(`ttpu-lms.service`, `ttpu-bot.service`) + `pg_dump` cron (kunlik, rotation) + restore
qo'llanmasi + monitoring (health tekshiruvi, uptime). Domen (masalan `lms.ttpu.uz` yoki
boshqa) DNS A-record.
**DoD:** doimiy URL ishlaydi; server rebootda o'zi ko'tariladi; backup tiklash sinovi o'tgan.
**Hudud:** `scripts/deploy-prod.sh`, `deploy/**` (Caddyfile, systemd units), README "Production".

### T15 — E2E Playwright · P2 · Lane B

**Yechim:** asosiy oqimlar: login → kurs → topshiriq topshirish; quiz ishlash; davomat belgilash;
chat; admin toggle. CI'da headless.
**DoD:** 5+ test yashil; screenshotlar artifact.

---

## 3. Coordination

- **STATUS.md** — har merge'da yangilanadi (nima qilindi, kim, qolgan ish).
- **Bloklovchilar** — STATUS.md "Bloklovchi muammolar" bo'limiga yoziladi.
- **Schema so'rovi** — PR tavsifida: model/maydon, nima uchun, migration nomi. Komp 1 migratsiya
  qilib beradi (yoki ruxsat bergach o'zingiz; `prisma migrate dev --name ...`).
- **Konflikt qoidasi:** modul egasining kodi ustun; umumiy fayllar faqat Komp 1 orqali.
- **Haftalik sync:** Telegram guruhda 15 daqiqa — nima merge bo'ldi, kim nimaga tiqilib qoldi.
