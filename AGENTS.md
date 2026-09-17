# TTPU LMS — Agent qo'llanmasi

## Loyiha nima?
Turin Politexnika Universiteti (TTPU) uchun kompakt LMS (Moodle analogi, lekin sodda va tez).
Demo ma'lumotlar bazasi jadvaldagi haqiqiy darslar bilan to'ldirilgan (guruh AI2-26).

## Stack (muzlatilgan)
- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Prisma 6 + PostgreSQL** (port 5433, user-space klaster: `scripts/db.sh`)
- **Auth:** jose JWT, cookie `ttpu_session` (`src/lib/auth.ts`)
- **UI:** Tailwind v4 + `src/components/ui.tsx` kit
- **Validatsiya:** zod

## MUHIM: Next.js 16 boshqacha
Bu Next.js versiyasi sizning bilimingizdagidan farq qiladi (breaking changes).
Kod yozishdan oldin **albatta** `node_modules/next/dist/docs/` ichidagi tegishli qo'llanmani o'qing.
Fayl konventsiyasi, props tiplari (`LayoutProps<"/">`), `cookies()` async va h.k. o'zgargan.

## Buyruqlar
```bash
npm run dev        # http://localhost:3000
npm run build      # MAJBURIY: har ish oxirida build o'tishi shart
npm run lint       # eslint
bash scripts/db.sh # PostgreSQL ishga tushirish (port 5433)
npm run db:seed    # demo ma'lumotlar
npm run db:studio  # Prisma Studio
```

## Demo loginlar (parol: ttpu1234)
- admin@ttpu.uz — ADMIN
- n.mahamatov@ttpu.uz — TEACHER
- ozodbek@ttpu.uz — STUDENT (AI2-26)

## Qoidalar (majburiy)
1. **CONTRACT.md** ni o'qing — u yerda API format, egalik jadvali, muzlatilgan fayllar bor.
2. Faqat **o'z modul papkangizda** ishlang. Boshqalarning fayllariga tegmaslik.
3. **Muzlatilgan fayllar** (faqat Komp 1 o'zgartiradi):
   `prisma/schema.prisma`, `src/lib/**`, `src/components/ui.tsx`,
   `src/app/(app)/layout.tsx`, `src/app/api/auth/**`, `src/app/api/me/**`
4. API javob formati: `{ ok: true, data }` yoki `{ ok: false, error }`.
5. Kodda **izoh yozilmaydi**. TypeScript strict — `any` ishlatilmaydi.
6. Server component — default. `"use client"` faqat interaktiv joyda.
7. Har ish oxirida: `npm run build` muvaffaqiyatli o'tishi shart.
8. Git: push'dan oldin `git pull --rebase origin main`. O'z branch'ingizda ishlaysiz.

## Auth ishlatish (API route misoli)
```ts
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
```

## Sahifa misoli (server component)
```tsx
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";

export default async function Page() {
  const user = await requireUser();
  const courses = await prisma.course.findMany();
  return (
    <>
      <PageHeader title="Kurslar" subtitle={`${courses.length} ta`} />
      <Card>...</Card>
    </>
  );
}
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
