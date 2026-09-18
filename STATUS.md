# STATUS — qurilish holati

Oxirgi yangilanish: LEGO konstruktor + Jurnal 2.0 + Modul sozlamalari (Komp 1)

## To'lqin 8 — "LEGO" qurish tizimi

- [x] **Jadval konstruktori** `/schedule/builder` — drag & drop: fan/xona bloklarini
      katakka sudrab tashlash (yoki mobil: bosib tanlab, katakka bosish); konflikt 409 →
      toast "Bu vaqt band"; ko'chirish/tahrir/o'chirish; LEGO uslub, snap animatsiyalar;
      o'qituvchi o'z fanlarini o'zi qo'shadi (o'z fanlari palette'si)
- [x] **Jurnal 2.0** — rasmdagidek mobil uslub: dumaloq rangli badge'lar (K/Kech/S/Y),
      avatarlar, oy navigatsiyasi, bugun ustuni; **Reyting** (top 10, medal)
- [x] **Modul sozlamalari** `/admin/settings` — 6 modulni (chat, sertifikat, kalendar,
      katalog, forum, QR davomat) o'yindek yoqish/o'chirish; nav avtomatik moslashadi
- [x] Baza: `AppSetting` modeli

## Jadval 2.0 (to'lqin 7)

- [x] **Hafta navigatsiyasi** — ← Bugun →, hafta sanalari, juft/toq hafta (#raqam) avtomatik
- [x] **Hozir / Keyingi dars** banner — jonli countdown bilan
- [x] **Jadval / Ro'yxat** ko'rinishlari (mobil uchun agenda)
- [x] **Guruh / O'qituvchi / Xona** rejimlari (staff uchun qidiruv)
- [x] **Dars holatlari** — O'zgargan / Ko'chirilgan / Bekor qilindi + izoh;
      bekor qilinganda guruhga **avtomatik xabarnoma**; tiklanganda ham
- [x] **Eksport** — `.ics` (Google/Apple Calendar import, paritet va bekor bilan),
      **Chop etish** sahifasi (A4, logo bilan)
- [x] **Bot** — yangi `/hafta` buyrug'i (kun-kun, bugun belgisi, holatlar)

## Davomat oqimi + 80% qoidasi (to'lqin 5)

- [x] **Dars-davomat oqimi** — o'qituvchi dashboard'da "Bugungi darslarim" (jadval bo'yicha):
      har darsda davomat holati (X/Y) + "Davomat belgilash" → talabalar ro'yxati K/Y/Kech/S,
      "Hammasi keldi", saqlash; jadvaldan ham bir bosishda
- [x] **80% qoidasi** — `/api/attendance/summary`, grades va kurs sahifasida
      "Imtihonga ruxsat" / "Ruxsat yo'q" badge; CSV eksportda yangi ustunlar
- [x] **Bot** — yangi `/davomat` buyrug'i o'qituvchi uchun (havolalar bilan);
      08:00 eslatmada o'qituvchiga darslari + davomat eslatmasi

## Yangi (to'lqin 4)

- [x] **Facebook-uslub profil** — cover rasm, katta avatar (yuklash bilan), bio (300 belgi),
      statistika (kurslar/sertifikatlar/o'rtacha), boshqa foydalanuvchi profili `/users/[id]`
- [x] **Chat tizimi** — DM (student↔teacher↔admin): suhbatlar ro'yxati, o'qilmagan badge
      (sidebar), 5s polling, foydalanuvchi qidiruvi, `?user=` bilan to'g'ridan-to'g'ri ochish,
      1 soniya flood himoyasi
- [x] **Admin chartlar** — sof SVG (Donut/Bar/Line): rollar, topshiriqlar 14 kun,
      davomat foizi, top kurslar; `/admin` "Tahlillar" bo'limi
- [x] **Telegram bot jonli** — @ttpu_uz_bot ishga tushdi (`node bot/telegram.mjs`),
      `/jadval`, `/ertaga`, kunlik eslatma 08:00, data.json (gitignored)

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
