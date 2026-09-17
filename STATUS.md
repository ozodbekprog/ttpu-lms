# STATUS — qurilish holati

Oxirgi yangilanish: Faza 0 (Komp 1)

## Kompyuterlar

| Komp | Topshiriq | Branch | Holat |
|---|---|---|---|
| 1 | Orchestrator: integratsiya, merge, dashboard, profil | `main` + `feat/comp1-*` | 🟢 Faza 0 tayyor |
| 2 | Kurslar, topshiriqlar, baholar, davomat | `feat/comp2-courses` | ⏳ Boshlanmagan |
| 3 | Testlar, jadval, Telegram bot | `feat/comp3-quiz-schedule` | ⏳ Boshlanmagan |
| 4 | Admin panel, upload, bildirishnomalar, dizayn | `feat/comp4-admin` | ⏳ Boshlanmagan |

## Faza 0 da tayyor (main)

- [x] Next.js 16 + Tailwind v4 + Prisma 6 (PostgreSQL 5433) skelet
- [x] DB sxema: User, Group, Course, Section, Material, Assignment, Submission, Attendance, Quiz, Question, QuizAttempt, ScheduleEntry, Notification
- [x] Auth: login/register/logout/me (jose JWT, cookie) + login/register sahifalari
- [x] UI kit (`src/components/ui.tsx`) + protected shell (sidebar layout)
- [x] Dashboard (o'qituvchi/talaba) + demo seed (AI2-26 jadvali bilan)
- [x] Hujjatlar: AGENTS.md, CONTRACT.md, tasks/comp1-4.md, scripts/setup.sh
- [x] `npm run build` yashil

## Merge qilingan modullar

_(bo'sh — PR lar kutilyapti)_

## Bloklovchi muammolar

_(yo'q)_
