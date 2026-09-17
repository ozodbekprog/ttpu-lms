# STATUS — qurilish holati

Oxirgi yangilanish: UI jilo to'lqini (Komp 1)

## UI jilo (brend dizayn tizimi)

- [x] Brend tokenlar: `brand-*` (navy #1d3460), `gold-*` aksent, surface fon, yumshoq soyalar
- [x] Logo (TTPU emblem SVG) + favicon + sidebar/topbar yangilandi
- [x] `ui.tsx` v2: nafis Card/Button/Badge/Stat/Input + Progress/Skeleton
- [x] Sidebar: faol holat pill (navy), gold nuqta indikatori, foydalanuvchi kartasi
- [x] Sahifalar qayta dizayn: landing, auth (demo hisob chips), dashboard, kurslar,
      topshiriqlar, e'lon/forum, testlar (fokus rejimi), jadval, baholar, hisobot,
      kalendar, sertifikat (print saqlangan), davomat/check-in, admin, katalog,
      bildirishnoma, profil
- [x] 5 parallel UI agent, tsc 0 xato, 14 sahifa 200

## To'lqin 3 da qo'shildi

- [x] **Talaba fayl topshirish** — upload API (10MB, magic bytes) + forma + o'qituvchi yuklab olish
- [x] **Katalog + enrollment** — published kurslar katalogi, o'zi yozilish, staff boshqaruvi
- [x] **E'lonlar + forum** — kurs e'lonlari (bildirishnoma bilan), forum mavzular/javoblar, pin
- [x] **Hisobot + eksport** — /reports sahifasi, statistika, 3 xil CSV eksport (BOM bilan)
- [x] **Kalendar + eslatma** — oylik deadline kalendari, quiz dueAt, botda kunlik eslatma (08:00)
- [x] **Sertifikat** — berish/bekor qilish, A4 print-friendly sahifa (PDF chop etish)
- [x] **QR davomat** — sessiya + kod, QR ko'rsatish, talaba check-in sahifasi
- [x] Sidebar yangilandi (Katalog, Kalendar, Sertifikatlar, Hisobotlar)

## DB migratsiyalar

- `wave3`: Announcement, ForumTopic, ForumReply, Certificate, AttendanceSession + Quiz.dueAt

## Modul holati (jami)

| Modul | Holat |
|---|---|
| Auth, profil, rollar | ✅ |
| Kurslar, materiallar, sectionlar | ✅ |
| Topshiriqlar (fayl bilan), baholar, davomat | ✅ |
| Testlar (timer, auto-baho, results API) | ✅ |
| Jadval + Telegram bot (+eslatma) | ✅ |
| Admin, upload, bildirishnomalar | ✅ |
| Katalog, forum, hisobot, kalendar, sertifikat, QR | ✅ |
| Xavfsizlik (review + tuzatishlar) | ✅ |

## Keyingi g'oyalar (P2)

- [ ] Vitest testlar (regressiya himoyasi)
- [ ] Sessiyani bekor qilish (sessionEpoch)
- [ ] PWA (telefonga o'rnatish)
- [ ] uz/ru/en til almashtirish
- [ ] Video/BBB integratsiya

## Holat: `main` yashil
