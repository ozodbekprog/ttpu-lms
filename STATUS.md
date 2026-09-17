# STATUS — qurilish holati

Oxirgi yangilanish: To'lqin 1 tugadi (6 parallel agent, Komp 1)

## Kompyuterlar

| Komp | Topshiriq | Branch | Holat |
|---|---|---|---|
| 1 | Orchestrator: integratsiya, merge, dashboard, profil | `main` | 🟢 To'lqin 1 merge qilindi |
| 2 | Kurslar, topshiriqlar, baholar, davomat | `feat/comp2-courses` | 🟢 Bajarildi (lokal agent) |
| 3 | Testlar, jadval, Telegram bot | `feat/comp3-quiz-schedule` | 🟡 Test+jadval bajarildi, bot qoldi |
| 4 | Admin panel, upload, bildirishnomalar, dizayn | `feat/comp4-admin` | 🟢 Bajarildi (lokal agent) |

## Merge qilingan modullar (main)

- [x] **Kurslar** — ro'yxat, yaratish/tahrir/o'chirish, section+material CRUD, talabalar tab
- [x] **Topshiriqlar** — CRUD, topshirish (LATE), baholash + feedback
- [x] **Baholar** — talaba jurnali, o'qituvchi jurnali
- [x] **Davomat** — bulk belgilash, talaba statistikasi
- [x] **Testlar** — 3 savol turi, timer, avtomatik baholash, qo'lda TEXT baholash, urinish limiti
- [x] **Jadval** — haftalik setka, guruh tanlash, staff CRUD (AI2-26 seed bilan)
- [x] **Admin panel** — statistika, users/groups/courses boshqaruvi
- [x] **Upload** — /api/upload (≤20MB, sanitizatsiya)
- [x] **Bildirishnomalar** — API, sahifa, NotificationBell (layoutga ulandi)
- [x] **Landing** — yangi dizayn

## Bloklovchi muammolar

_(yo'q — build yashil, tsc toza)_

## Keyingi ishlar (P1)

- [ ] Telegram bot (`bot/telegram.mjs`) — Komp 3
- [ ] Material qo'shilganda talabalarga notification (ixtiyoriy)
- [ ] Profil sahifasi + parol o'zgartirish — Komp 1
- [ ] Seed'ga ko'proq demo kontent
