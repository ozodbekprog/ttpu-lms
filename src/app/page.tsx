import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";

const FEATURES = [
  {
    title: "Kurslar",
    description:
      "Fanlar bo'limlarga ajratilgan: ma'ruza matnlari, fayllar, videolar va qo'shimcha resurslar bir joyda.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "Topshiriqlar",
    description:
      "Topshiriqlarni yuklash, muddatlarni kuzatish va o'qituvchi tomonidan onlayn baholash jarayoni.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Testlar",
    description:
      "Vaqt chegarasi bilan onlayn testlar, avtomatik baholash va natijalar tahlili bir zumda.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    title: "Jadval",
    description:
      "Guruh dars jadvali: juftliklar, xonalar va o'qituvchilar har doim qo'l ostida.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Davomat",
    description:
      "Har bir dars uchun davomatni belgilash, sabablarni qayd etish va hisobotlarni ko'rish.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Telegram bot",
    description:
      "Bildirishnomalar, baholar va muhim eslatmalar Telegram orqali darhol yetib boradi.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "20 000+", label: "Faol foydalanuvchi" },
  { value: "1 800+", label: "O'quv kursi" },
  { value: "120+", label: "Malakali o'qituvchi" },
  { value: "24/7", label: "Qo'llab-quvvatlash" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-base font-bold tracking-tight text-slate-900">
            TTPU <span className="text-blue-600">LMS</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#imkoniyatlar" className="transition hover:text-slate-900">
              Imkoniyatlar
            </a>
            <a href="#statistika" className="transition hover:text-slate-900">
              Statistika
            </a>
            <a href="#aloqa" className="transition hover:text-slate-900">
              Aloqa
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Kirish
            </ButtonLink>
            <ButtonLink href="/register">Ro&apos;yxatdan o&apos;tish</ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-slate-100 bg-gradient-to-b from-blue-50 via-white to-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <Badge tone="blue">Turin Politexnika Universiteti</Badge>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                TTPU <span className="text-blue-600">LMS</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                Kurslar, topshiriqlar, testlar, dars jadvali va davomat — butun o&apos;quv
                jarayoni bitta zamonaviy va tezkor platformada.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/login">Kirish</ButtonLink>
                <ButtonLink href="/register" variant="secondary">
                  Ro&apos;yxatdan o&apos;tish
                </ButtonLink>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Demo kirish:{" "}
                <span className="font-medium text-slate-700">ozodbek@ttpu.uz</span> /{" "}
                <span className="font-medium text-slate-700">ttpu1234</span>
              </p>
            </div>
          </div>
        </section>

        <section id="imkoniyatlar" className="bg-slate-50 py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Bitta platformada butun o&apos;quv jarayoni
              </h2>
              <p className="mt-3 text-slate-600">
                Talabalar va o&apos;qituvchilar uchun zarur bo&apos;lgan barcha vositalar
                sodda, tez va qulay interfeysda.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 transition hover:border-blue-200 hover:shadow-md"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {feature.icon}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="statistika" className="bg-blue-600 py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold tracking-tight text-white">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto w-full max-w-4xl px-6">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 px-8 py-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                O&apos;qishni bugun boshlang
              </h2>
              <p className="max-w-xl text-slate-600">
                Tizimga kiring yoki yangi hisob yarating — barcha kurslar va materiallar sizni
                kutmoqda.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/login">Tizimga kirish</ButtonLink>
                <ButtonLink href="/register" variant="secondary">
                  Ro&apos;yxatdan o&apos;tish
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="aloqa" className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-base font-bold text-white">
              TTPU <span className="text-blue-400">LMS</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">
              Turin Politexnika Universiteti uchun zamonaviy o&apos;quv boshqaruv tizimi.
              Ta&apos;lim jarayonini raqamlashtirish va soddalashtirish uchun yaratilgan.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Platforma</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/login" className="transition hover:text-white">
                  Kirish
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition hover:text-white">
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-white">
                  Shaxsiy kabinet
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Aloqa</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>info@ttpu.uz</li>
              <li>+998 71 289 99 00</li>
              <li>Toshkent, O&apos;zbekiston</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-6xl border-t border-slate-800 px-6 pt-6">
          <p className="text-xs text-slate-500">
            © 2026 Turin Politexnika Universiteti. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
}
