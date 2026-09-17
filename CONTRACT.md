# CONTRACT.md — muzlatilgan shartnoma (v1)

Bu fayl 4 kompyuterda 20+ agent parallel ishlashi uchun **yagona qonun**.
O'zgartirish faqat Komp 1 (orchestrator) orqali, PR bilan.

## 1. API formati (majburiy)

Muvaffaqiyat:
```json
{ "ok": true, "data": { ... } }
```
Xato:
```json
{ "ok": false, "error": "Inson o'qiy oladigan xabar" }
```

Status kodlar: `400` validatsiya, `401` auth yo'q, `403` rol yetarli emas, `404` topilmadi, `409` konflikt.

Barcha POST/PATCH body'lar zod bilan tekshiriladi.

## 2. Auth

- Cookie: `ttpu_session` (httpOnly JWT)
- `src/lib/auth.ts`: `getSession()`, `getCurrentUser()`, `requireUser()`, `requireRole([...])`, `createSession()`, `destroySession()`
- API route'da: `const user = await getCurrentUser()` → `null` bo'lsa 401.

## 3. Muzlatilgan fayllar (faqat Komp 1 o'zgartiradi)

| Fayl | Nima uchun |
|---|---|
| `prisma/schema.prisma` | DB shartnoma — hamma unga tayanadi |
| `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/utils.ts` | Umumiy yadro |
| `src/components/ui.tsx` | UI kit (Button, Card, Input, Badge, Stat, ...) |
| `src/app/(app)/layout.tsx` | Shell/sidebar — bitta egasi bo'lishi shart |
| `src/app/api/auth/**`, `src/app/api/me/**` | Auth API |
| `src/app/layout.tsx`, `src/app/page.tsx`* | Root layout / landing (*landing siyosati Komp 4) |

Boshqa modullar bu fayllarga **tegmaydi**. Kerak bo'lsa — Komp 1 ga PR yoki xabar.

## 4. Papka egaligi (har kim faqat o'ziniki)

| Komp | Papkalar |
|---|---|
| **Komp 1** | butun layihani birlashtirish, `src/app/(app)/dashboard/**`, `src/app/(app)/profile/**`, yuqoridagi muzlatilgan fayllar |
| **Komp 2** | `src/app/(app)/courses/**`, `src/app/(app)/grades/**`, `src/app/api/courses/**`, `src/app/api/sections/**`, `src/app/api/materials/**`, `src/app/api/assignments/**`, `src/app/api/submissions/**`, `src/app/api/attendance/**`, `src/components/courses/**` |
| **Komp 3** | `src/app/(app)/quizzes/**`, `src/app/(app)/schedule/**`, `src/app/api/quizzes/**`, `src/app/api/questions/**`, `src/app/api/schedule/**`, `src/components/quiz/**`, `bot/**` |
| **Komp 4** | `src/app/(app)/admin/**`, `src/app/(app)/notifications/**`, `src/app/api/admin/**`, `src/app/api/notifications/**`, `src/app/api/upload/**`, `src/components/admin/**`, `src/components/notifications/**`, landing sahifa |

Yangi papka kerak bo'lsa — o'z prefiksida yarating.

## 5. Modul API rejasi (kelishilgan yo'llar)

**Komp 2:**
- `GET/POST /api/courses`, `GET/PATCH/DELETE /api/courses/[id]`
- `GET/POST /api/courses/[id]/sections`, `PATCH/DELETE /api/sections/[id]`
- `GET/POST /api/sections/[id]/materials`, `PATCH/DELETE /api/materials/[id]`
- `GET/POST /api/courses/[id]/assignments`, `GET/PATCH/DELETE /api/assignments/[id]`
- `POST /api/assignments/[id]/submissions` (talaba topshiradi), `GET` (o'qituvchi ko'radi)
- `PATCH /api/submissions/[id]` (baholash: score, feedback, status=GRADED)
- `GET/POST /api/courses/[id]/attendance` (bulk belgilash)

**Komp 3:**
- `GET/POST /api/quizzes`, `GET/PATCH/DELETE /api/quizzes/[id]`
- `POST /api/quizzes/[id]/questions`, `PATCH/DELETE /api/questions/[id]`
- `POST /api/quizzes/[id]/attempts` (start), `PATCH /api/attempts/[id]` (submit → avtomatik baholash)
- `GET /api/schedule?groupId=`, `POST /api/schedule`, `PATCH/DELETE /api/schedule/[id]`

**Komp 4:**
- `GET/PATCH/DELETE /api/admin/users`, `POST /api/admin/users`
- `GET/POST /api/admin/groups`
- `POST /api/upload` — `multipart/form-data`, field `file` → `{ ok, data: { url: "/uploads/<name>" } }`
- `GET /api/notifications`, `PATCH /api/notifications` (o'qilgan belgilash)

## 6. UI qoidalari

- Sahifalar `src/app/(app)/` ichida, `PageHeader` bilan boshlanadi.
- Faqat `src/components/ui.tsx` dagi komponentlar + Tailwind klasslar.
- Ranglar: slate (asosiy), blue (brend), emerald/amber/rose (holatlar).
- Sahifalar sarlavha/tugmalari o'zbek tilida, kod inglizcha.

## 7. Git tartibi

- Branch: `feat/comp<N>-<modul>` (masalan `feat/comp2-courses`)
- Har 30 daqiqada: `git add -A && git commit -m "..." && git pull --rebase origin main && git push -u origin HEAD`
- Komp 1 PR larni review qilib `main` ga merge qiladi.
- Konflikt bo'lsa: o'z fayllaringizni saqlab, boshqalarnikini qabul qilasiz, keyin Komp 1 ga xabar.

## 8. Definition of Done (har modul)

1. Sahifa(lar) ishlaydi (dev serverda ochiladi)
2. API lar `{ ok, data }` formatida
3. Rol tekshiruvlari bor (talaba/o'qituvchi/admin)
4. `npm run build` xatosiz o'tadi
5. Commit + push qilingan
