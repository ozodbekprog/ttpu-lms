import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { Logo } from "@/components/brand/logo";

const NAV_LINKS = [
  { href: "#imkoniyatlar", label: "Imkoniyatlar" },
  { href: "#statistika", label: "Statistika" },
  { href: "#aloqa", label: "Aloqa" },
];

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

const FOOTER_LINKS = [
  { href: "/login", label: "Kirish" },
  { href: "/register", label: "Ro'yxatdan o'tish" },
  { href: "/dashboard", label: "Shaxsiy kabinet" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="transition-opacity duration-150 hover:opacity-80">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors duration-150 hover:text-brand-800"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Kirish
            </ButtonLink>
            <ButtonLink href="/register" size="sm">
              Ro&apos;yxatdan o&apos;tish
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-brand-50 via-white to-white">
          <div className="pointer-events-none absolute -left-24 top-12 size-72 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-16 size-80 rounded-full bg-gold-300/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--color-brand-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-100)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent_75%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <Badge tone="brand" className="gap-2 px-3.5 py-1.5 text-xs">
                <span className="size-1.5 rounded-full bg-gold-400" />
                Turin Politexnika Universiteti
              </Badge>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-brand-950 sm:text-5xl lg:text-6xl">
                Butun o&apos;quv jarayoni{" "}
                <span className="underline decoration-gold-400 decoration-2 underline-offset-[6px]">
                  yagona platformada
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                Kurslar, topshiriqlar, testlar, davomat va dars jadvali — talabalar va
                o&apos;qituvchilar uchun zarur bo&apos;lgan hamma narsa tez, qulay va
                ishonchli.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ButtonLink href="/login" size="lg" className="w-full min-w-44 sm:w-auto">
                  Kirish
                </ButtonLink>
                <ButtonLink
                  href="/register"
                  variant="secondary"
                  size="lg"
                  className="w-full min-w-44 sm:w-auto"
                >
                  Ro&apos;yxatdan o&apos;tish
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section id="imkoniyatlar" className="py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Imkoniyatlar
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Bitta platformada butun o&apos;quv jarayoni
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Talabalar va o&apos;qituvchilar uchun zarur bo&apos;lgan barcha vositalar
                sodda, tez va qulay interfeysda.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="group p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-200 group-hover:bg-brand-100">
                    {feature.icon}
                  </span>
                  <h3 className="mt-5 font-semibold tracking-tight text-brand-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="statistika" className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-900 px-6 py-14 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-brand-600/30 blur-3xl" />
            <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <span className="mx-auto block h-0.5 w-8 rounded-full bg-gold-400 sm:mx-0" />
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 px-6 py-14 text-center sm:px-12">
            <Badge tone="gold">Boshlash uchun tayyor</Badge>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
              O&apos;qishni bugun boshlang
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-600">
              Tizimga kiring yoki yangi hisob yarating — barcha kurslar va materiallar sizni
              kutmoqda.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/login" size="lg" className="w-full min-w-44 sm:w-auto">
                Tizimga kirish
              </ButtonLink>
              <ButtonLink
                href="/register"
                variant="secondary"
                size="lg"
                className="w-full min-w-44 sm:w-auto"
              >
                Ro&apos;yxatdan o&apos;tish
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer id="aloqa" className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-500">
              Turin Politexnika Universiteti uchun zamonaviy o&apos;quv boshqaruv tizimi.
              Ta&apos;lim jarayonini raqamlashtirish va soddalashtirish uchun yaratilgan.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-950">Platforma</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors duration-150 hover:text-brand-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-950">Aloqa</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li>info@ttpu.uz</li>
              <li>+998 71 289 99 00</li>
              <li>Toshkent, O&apos;zbekiston</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
            <p className="text-xs text-slate-400">
              © 2026 Turin Politexnika Universiteti. Barcha huquqlar himoyalangan.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-brand-500"
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              Demo:
              <span className="font-medium text-slate-600">ozodbek@ttpu.uz</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-600">ttpu1234</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
