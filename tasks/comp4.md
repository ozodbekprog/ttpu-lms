# Komp 4 — Admin panel, fayl yuklash, bildirishnomalar, dizayn

**Branch:** `feat/comp4-admin`
**Egali papkalar:** CONTRACT.md §4 (admin, notifications, upload, landing).

## Vazifalar

### P0 — Admin panel
1. `/admin` bosh sahifa: statistika (users, courses, groups, submissions).
2. `/admin/users`: ro'yxat + qidiruv + filtr (rol bo'yicha); foydalanuvchi yaratish/tahrirlash (name, email, role, groupId, isActive); parol reset.
3. `/admin/groups`: guruhlar CRUD (nom, year).
4. `/admin/courses`: kurslar ro'yxati, publish/unpublish (Komp 2 API'sidan foydalanadi), o'qituvchi biriktirish.
5. Faqat ADMIN roli — API'larda ham tekshiriladi.

### P0 — Fayl yuklash
6. `POST /api/upload`: `multipart/form-data`, field `file`; `public/uploads/` ga saqlash (random nom, kengaytma saqlanadi).
7. Cheklovlar: hajm ≤ 20MB, ruxsat etilgan turlar: png/jpg/webp/pdf/zip/docx/pptx/txt.
8. Javob: `{ ok, data: { url: "/uploads/<fayl>" } }`.
9. Komponent: `src/components/admin/FileUpload.tsx` (client) — Komp 2/3 ishlatishi mumkin.

### P0 — Bildirishnomalar
10. `GET /api/notifications` — o'z bildirishnomalari; `PATCH /api/notifications` — o'qilgan belgilash.
11. `/notifications` sahifasi.
12. `src/components/notifications/NotificationBell.tsx` — (client, 30s poll) — **Komp 1 layoutga ulaydi, o'zingiz layoutga tegmang**.
13. Kursga material/topshiriq qo'shilganda talabalarga notification yaratish — ixtiyoriy (Komp 2 bilan kelishilgan holda, faqat o'z API'ingiz orqali).

### P1 — Dizayn
14. Landing (`src/app/page.tsx`) ni professional qilish: hero, imkoniyatlar, statistika, footer.
15. `src/components/ui-extras.tsx` — yangi UI elementlar (modal, tabs, toast) — `ui.tsx` ga TEGILMAYDI.

## Tekshirish
- `npm run build` yashil.
- admin@ttpu.uz bilan kirib admin panel ishlaydi.
- Fayl yuklab, URL qaytishini tekshirish.
