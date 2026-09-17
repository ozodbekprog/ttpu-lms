# Komp 1 — Orchestrator (asosiy kompyuter)

**Branch:** `feat/comp1-core`
**Rol:** integratsiya, review, merge, umumiy sifat. Faqat shu kompyuter muzlatilgan fayllarni o'zgartiradi.

## Vazifalar

### P0 — Integratsiya va barqarorlik
1. Har 20-30 daqiqada: boshqa branch'larni ko'rib chiqish, `main` ga merge qilish.
2. Merge'dan keyin `npm run build` — yashil bo'lishi shart. Buzilsa — tuzatish yoki PR muallifiga qaytarish.
3. Konfliktlarni hal qilish (qoida: modul egasining fayli ustun).
4. Xavfsizlik review: har API'da rol tekshiruvi bormi, o'quvchi boshqaning ma'lumotini ko'rmayaptimi.

### P0 — Dashboard va profil
5. `src/app/(app)/dashboard/page.tsx` — o'qituvchi/talaba/admin uchun real statistika (allaqachon boshlangan, yaxshilash).
6. `src/app/(app)/profile/page.tsx` + `src/app/api/profile/route.ts` (PATCH: name, avatarUrl; parol o'zgartirish alohida).
7. Sidebar'ga "Profil" havolasini qo'shish.

### P1 — Bildirishnomalar integratsiyasi
8. Komp 4 yozgan `src/components/notifications/NotificationBell.tsx` ni `(app)/layout.tsx` ga ulash.
9. `/notifications` sahifasiga sidebar havolasi (agar mavjud bo'lsa).

### P2 — Sifat
10. `npm run db:seed` yaxshilash (ko'proq demo kontent: baholar, urinishlar).
11. README'ni yangilab borish.

## Qoidalar
- Faqat `main` ga merge qiladi: `git checkout main && git merge feat/compN-... && npm run build`.
- Muzlatilgan fayllar ro'yxati: CONTRACT.md §3.
- Har merge'dan keyin boshqalarga xabar: "main yangilandi, rebase qiling".
