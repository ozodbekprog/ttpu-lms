import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { Logo } from "@/components/brand/logo";

const NAV_LINKS = [
  { href: "#imkoniyatlar", label: "Imkoniyatlar" },
  { href: "#boshlash", label: "Qanday boshlash" },
  { href: "#statistika", label: "Statistika" },
  { href: "#aloqa", label: "Aloqa" },
];

const DASH_NAV = [
  { label: "Boshqaruv", active: true },
  { label: "Kurslar", active: false },
  { label: "Jadval", active: false },
  { label: "Baholar", active: false },
  { label: "Transkript", active: false },
  { label: "Bron qilish", active: false },
];

const DASH_STATS = [
  { label: "GPA", value: "3.8" },
  { label: "Davomat", value: "94%" },
  { label: "Topshiriq", value: "12" },
];

const DASH_BARS = [
  { day: "Du", value: 44, highlight: false },
  { day: "Se", value: 66, highlight: false },
  { day: "Cho", value: 52, highlight: false },
  { day: "Pay", value: 78, highlight: false },
  { day: "Jum", value: 60, highlight: true },
  { day: "Sha", value: 90, highlight: true },
  { day: "Yak", value: 48, highlight: false },
];

const DASH_SCHEDULE = [
  { time: "09:00", title: "Differensial tenglamalar", room: "A-204", tone: "bg-brand-500" },
  { time: "10:30", title: "Programmalash asoslari", room: "B-311", tone: "bg-gold-400" },
  { time: "13:00", title: "Fizika (amaliy)", room: "Lab-2", tone: "bg-emerald-500" },
];

const TRUST_ITEMS = ["O'zbek tilida", "Barcha qurilmalarda", "Xavfsiz saqlash"];

const FEATURES = [
  {
    title: "Kurslar va materiallar",
    description:
      "Fanlar bo'limlarga ajratilgan: ma'ruza matnlari, fayllar, videolar va qo'shimcha resurslar bir joyda.",
    badge: null,
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
    badge: null,
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
    title: "Testlar va baholash",
    description:
      "Vaqt chegarasi bilan onlayn testlar, avtomatik baholash va natijalar tahlili bir zumda.",
    badge: null,
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
    title: "GPA va kreditlar",
    description:
      "Semestr GPA si, yig'ilgan kreditlar va fan bo'yicha baholar real vaqtda hisoblanadi.",
    badge: "Yangi",
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
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    title: "Rasmiy transkript",
    description:
      "Transkript avtomatik shakllanadi: barcha semestrlar, baholar va kreditlar bitta hujjatda.",
    badge: "Yangi",
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    title: "Elektron kundaliklar",
    description:
      "O'qituvchi kundaligi: mavzular, uy vazifalari va dars qaydlari yagona joyda saqlanadi.",
    badge: "Yangi",
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
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    title: "Xona va resurs bron",
    description:
      "Auditoriya, laboratoriya va jihozlarni band qilish bir necha bosqichda, tasdiqlash bilan.",
    badge: "Yangi",
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
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Telegram bot",
    description:
      "Bildirishnomalar, baholar va muhim eslatmalar Telegram orqali darhol yetib boradi.",
    badge: null,
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

const STEPS = [
  {
    title: "Ro'yxatdan o'ting",
    description:
      "Ism, email va parolni kiriting. Hisob 30 soniyada yaratiladi va darhol faollashadi.",
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
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
  {
    title: "Profilni to'ldiring",
    description:
      "Guruh va fakultetingizni tanlang — jadval hamda fanlar avtomatik biriktiriladi.",
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
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    title: "O'qishni boshlang",
    description:
      "Kurslar, topshiriqlar va baholar shaxsiy kabinetda. Hech narsa sozlash shart emas.",
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
        <path d="m5 3 14 9-14 9V3z" />
      </svg>
    ),
  },
];

const FOOTER_MODULES = [
  "Kurslar va materiallar",
  "Topshiriqlar va testlar",
  "GPA va transkript",
  "Elektron kundaliklar",
  "Xona va resurs bron",
  "Telegram bot",
];

const FOOTER_PLATFORM = [
  { href: "#imkoniyatlar", label: "Imkoniyatlar" },
  { href: "#boshlash", label: "Qanday boshlash" },
  { href: "/login", label: "Tizimga kirish" },
  { href: "/register", label: "Ro'yxatdan o'tish" },
  { href: "/help", label: "Yordam markazi" },
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
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-28">
            <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
              <Badge tone="brand" className="gap-2 px-3.5 py-1.5 text-xs">
                <span className="size-1.5 rounded-full bg-gold-400" />
                Turin Politexnika Universiteti
              </Badge>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-brand-950 sm:text-5xl lg:text-[3.4rem]">
                Butun o&apos;quv jarayoni{" "}
                <span className="underline decoration-gold-400 decoration-2 underline-offset-[6px]">
                  yagona platformada
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                Kurslar, topshiriqlar, testlar, GPA, transkript, kundaliklar va bron
                qilish — talabalar hamda o&apos;qituvchilar uchun hamma narsa tez,
                qulay va ishonchli.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
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
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-start">
                {TRUST_ITEMS.map((item) => (
                  <li key={item} className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4 text-emerald-500"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/60 via-white to-gold-300/30 blur-2xl" />
              <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-lift">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="size-2.5 rounded-full bg-rose-300" />
                  <span className="size-2.5 rounded-full bg-gold-300" />
                  <span className="size-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-2 hidden h-5 flex-1 items-center rounded-md bg-slate-100 px-2.5 text-[10px] font-medium text-slate-400 sm:flex">
                    lms.ttpu.uz/dashboard
                  </span>
                  <span className="size-5 rounded-md bg-brand-50" />
                </div>
                <div className="flex gap-2.5 rounded-xl bg-surface p-2.5 sm:p-3">
                  <aside className="hidden w-36 shrink-0 flex-col gap-1 rounded-xl border border-slate-100 bg-white p-2.5 sm:flex">
                    {DASH_NAV.map((item) => (
                      <span
                        key={item.label}
                        className={
                          item.active
                            ? "flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-800"
                            : "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500"
                        }
                      >
                        <span
                          className={
                            item.active
                              ? "size-1.5 rounded-full bg-brand-600"
                              : "size-1.5 rounded-full bg-slate-300"
                          }
                        />
                        {item.label}
                      </span>
                    ))}
                  </aside>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-600 text-[10px] font-semibold text-white">
                          OZ
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-slate-800">
                            Salom, Ozodbek
                          </p>
                          <p className="truncate text-[10px] text-slate-400">
                            AI2-26 · 2-semestr
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Faol
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {DASH_STATS.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                        >
                          <p className="text-[10px] font-medium text-slate-400">{stat.label}</p>
                          <p className="mt-0.5 text-sm font-semibold tracking-tight text-brand-900">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-700">
                          Haftalik faollik
                        </p>
                        <span className="text-[10px] font-medium text-slate-400">6/7 kun</span>
                      </div>
                      <div className="mt-3 flex h-20 items-end gap-1.5">
                        {DASH_BARS.map((bar) => (
                          <div
                            key={bar.day}
                            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                          >
                            <span
                              className={
                                bar.highlight
                                  ? "w-full rounded-t-md bg-gradient-to-t from-brand-800 to-brand-500"
                                  : "w-full rounded-t-md bg-brand-100"
                              }
                              style={{ height: `${bar.value}%` }}
                            />
                            <span className="text-[9px] font-medium text-slate-400">
                              {bar.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {DASH_SCHEDULE.map((item) => (
                        <div
                          key={item.time}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5"
                        >
                          <span className="w-9 shrink-0 text-[10px] font-semibold text-brand-700">
                            {item.time}
                          </span>
                          <span className={`h-7 w-1 shrink-0 rounded-full ${item.tone}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold text-slate-800">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400">{item.room}</p>
                          </div>
                          <span className="size-1.5 shrink-0 rounded-full bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 -top-6 hidden items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-lift backdrop-blur sm:flex">
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-gold-300/20 text-gold-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">GPA 3.8</p>
                  <p className="text-[10px] text-slate-400">Semestr reytingi</p>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-3 hidden items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-lift backdrop-blur sm:flex">
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Topshiriq baholandi</p>
                  <p className="text-[10px] text-slate-400">Matematika · 92 ball</p>
                </div>
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
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="group flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-200 group-hover:bg-brand-100">
                      {feature.icon}
                    </span>
                    {feature.badge ? <Badge tone="gold">{feature.badge}</Badge> : null}
                  </div>
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

        <section id="boshlash" className="border-y border-slate-200/70 bg-gradient-to-b from-white via-brand-50/50 to-white py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Boshlash
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                1 daqiqada boshlash
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Uchta oddiy qadam — keyin barcha kurslar, jadval va baholar avtomatik
                tayyor bo&apos;ladi.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <Card
                  key={step.title}
                  className="group relative h-full overflow-hidden p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-200 group-hover:bg-brand-100">
                      {step.icon}
                    </span>
                    <span className="text-3xl font-bold tracking-tight text-slate-100">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold tracking-tight text-brand-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg" className="w-full min-w-44 sm:w-auto">
                Hisob yaratish
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="secondary"
                size="lg"
                className="w-full min-w-44 sm:w-auto"
              >
                Demo hisob bilan kirish
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="statistika" className="px-4 py-20 sm:px-6 sm:py-24">
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
            <div className="relative mt-12 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
              <p className="max-w-xl text-sm leading-relaxed text-brand-200">
                Platforma har semestr yangilanadi: yangi modullar, tezkor tuzatishlar va
                universitet talablariga moslashuv.
              </p>
              <ButtonLink href="/register" variant="gold" size="lg" className="w-full sm:w-auto">
                Hoziroq qo&apos;shilish
              </ButtonLink>
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
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div>
              <Logo />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-500">
                Turin Politexnika Universiteti uchun zamonaviy o&apos;quv boshqaruv
                tizimi. Ta&apos;lim jarayonini raqamlashtirish va soddalashtirish uchun
                yaratilgan.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="brand">Next.js asosida</Badge>
                <Badge tone="green">Xavfsiz</Badge>
                <Badge tone="slate">Open API</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-950">Platforma</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
                {FOOTER_PLATFORM.map((link) => (
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
              <p className="text-sm font-semibold text-brand-950">Modullar</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
                {FOOTER_MODULES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-950">Aloqa</p>
              <ul className="mt-4 space-y-3.5 text-sm text-slate-500">
                <li className="flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 text-brand-500"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                  info@ttpu.uz
                </li>
                <li className="flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 text-brand-500"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  +998 71 289 99 00
                </li>
                <li className="flex items-start gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 size-4 shrink-0 text-brand-500"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Toshkent, O&apos;zbekiston
                </li>
                <li className="text-xs text-slate-400">Dushanba — Shanba, 09:00 — 18:00</li>
              </ul>
            </div>
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
