# Komp 2 — Kurslar, topshiriqlar, baholar

**Branch:** `feat/comp2-courses`
**Egali papkalar:** CONTRACT.md §4 (courses, grades, assignments, submissions, attendance).

## Vazifalar

### P0 — Kurslar
1. `/courses` sahifasi: talaba — o'z kurslari; o'qituvchi — o'zi o'qitadiganlar; admin — hammasi.
2. O'qituvchi uchun kurs yaratish/tahrirlash formasi (`/courses/new`, `/courses/[slug]/edit`).
3. `/courses/[slug]` sahifasi va tablar:
   - **Materiallar:** sectionlar + materiallar (TEXT markdown, LINK, VIDEO, FILE url)
   - **Topshiriqlar:** ro'yxat, muddat, holat
   - **Talabalar:** (o'qituvchi/admin) ro'yxat + enrollment
4. Section va material qo'shish/tahrirlash/o'chirish (o'qituvchi).

### P0 — Topshiriqlar
5. O'qituvchi: topshiriq CRUD (title, description, dueAt, maxScore).
6. Talaba: topshirish (`text` yoki `fileUrl`), muddat o'tsa `status=LATE`.
7. Qayta topshirish faqat `GRADED` bo'lmagan holatda.
8. O'qituvchi: submissions ro'yxati, baholash (`score`, `feedback`, `status=GRADED`, `gradedAt`).

### P0 — Baholar
9. `/grades`: talaba — barcha kurslar bo'yicha baholari (topshiriq + test); o'qituvchi — kurs bo'yicha jurnal (talabalar × topshiriqlar).

### P1 — Davomat
10. O'qituvchi: sanani tanlab guruhga davomat belgilash (PRESENT/ABSENT/LATE/EXCUSED) — bulk.
11. Talaba: o'z davomati foizi.

## API lar
CONTRACT.md §5 (Komp 2 ro'yxati). Har birida:
- `getCurrentUser()` + rol tekshiruvi
- Talaba faqat o'zi enrolled kursni ko'radi / topshiradi
- zod validatsiya, `{ ok, data }` formati

## Tekshirish
- `npm run build` yashil.
- Demo: ozodbek@ttpu.uz bilan kirib PROG kursida topshiriq topshirish ishlaydi.
- Teacher: n.mahamatov@ttpu.uz baholay oladi.
