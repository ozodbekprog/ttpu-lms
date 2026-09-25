import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { HelpIcon } from "@/components/help/icons";
import type { HelpIconName } from "@/components/help/icons";
import { QuickStart } from "@/components/help/quick-start";
import type { QuickStartStep } from "@/components/help/quick-start";
import { FaqList } from "@/components/help/faq";
import type { FaqItem } from "@/components/help/faq";
import { BotCommands } from "@/components/help/bot-commands";
import type { BotCommand } from "@/components/help/bot-commands";
import { ContactCards } from "@/components/help/contact";

export const metadata: Metadata = {
  title: "Yordam markazi — TTPU LMS",
  description: "TTPU LMS bo'yicha qo'llanmalar, savol-javoblar, bot buyruqlari va aloqa ma'lumotlari",
};

const QUICK_LINKS: { href: string; label: string; hint: string; icon: HelpIconName }[] = [
  { href: "#boshlash", label: "Tez boshlash", hint: "6 qadamli qo'llanma", icon: "sparkles" },
  { href: "#faq", label: "FAQ", hint: "Ko'p so'raladigan savollar", icon: "help" },
  { href: "#bot", label: "Bot buyruqlari", hint: "/jadval, /davomat, /qr va boshqalar", icon: "send" },
  { href: "#aloqa", label: "Aloqa", hint: "O'quv bo'limi va tyutor", icon: "mail" },
];

const STEPS: QuickStartStep[] = [
  {
    title: "Tizimga kirish",
    description:
      "Universitet bergan email va parol bilan kiring. Sessiya 7 kun davomida saqlanadi.",
    href: "/login",
    linkLabel: "Kirish sahifasi",
    icon: "login",
  },
  {
    title: "Kurslar va materiallar",
    description:
      "Kurslar bo'limidan fanlaringizni tanlang, ma'ruza va amaliy materiallarni o'qing.",
    href: "/courses",
    linkLabel: "Kurslarga o'tish",
    icon: "book",
  },
  {
    title: "Topshiriqlarni bajarish",
    description:
      "Kurs sahifasidagi topshiriqni ochib, faylni yuklang va topshirish muddatini kuzatib boring.",
    href: "/courses",
    linkLabel: "Topshiriqlar",
    icon: "clipboard",
  },
  {
    title: "Testlarni yechish",
    description:
      "Testlar belgilangan vaqt ichida bajariladi. Natijani baholar bo'limida ko'rasiz.",
    href: "/quizzes",
    linkLabel: "Testlar bo'limi",
    icon: "listChecks",
  },
  {
    title: "Davomatni belgilash",
    description:
      "O'qituvchi ko'rsatgan 6 belgili kod bilan davomatni tasdiqlang — bir necha soniyada.",
    href: "/attendance/check-in",
    linkLabel: "Davomat sahifasi",
    icon: "qr",
  },
  {
    title: "Telegram botga ulanish",
    description:
      "Botga /start yuboring — jadval va davomat endi doim yoningizdagi telefonda.",
    href: "#bot",
    linkLabel: "Bot buyruqlari",
    icon: "send",
  },
];

const FAQ: FaqItem[] = [
  {
    id: "parol",
    question: "Parolni qanday tiklayman?",
    answer: (
      <div className="space-y-2.5">
        <p>
          Tizimga kirgan bo&apos;lsangiz, profil sahifasidagi{" "}
          <span className="font-medium text-slate-800">Parolni o&apos;zgartirish</span> bo&apos;limi
          orqali yangi parol o&apos;rnatishingiz mumkin.
        </p>
        <p>
          Tizimga kira olmasangiz,{" "}
          <a
            href="mailto:academic.department@polito.uz"
            className="font-medium text-brand-700 hover:underline"
          >
            academic.department@polito.uz
          </a>{" "}
          manziliga yozing yoki 103-xonadagi tyutorga murojaat qiling — parol tez orada yangilanadi.
        </p>
      </div>
    ),
  },
  {
    id: "davomat-foizi",
    question: "Davomat foizi qanday hisoblanadi? (80% qoida)",
    answer: (
      <div className="space-y-3">
        <p>Davomat foizi quyidagi formula bo&apos;yicha hisoblanadi:</p>
        <p className="rounded-xl bg-brand-50 px-4 py-2.5 text-center font-medium text-brand-800 ring-1 ring-brand-100">
          Qatnashgan darslar ÷ Jami darslar × 100
        </p>
        <p>
          Universitet qoidasiga ko&apos;ra{" "}
          <span className="font-semibold text-slate-800">80%</span> dan past davomat bilan kursni
          yakunlash va sertifikat olish mumkin emas. Uzrli sabab bo&apos;lsa, tasdiqlovchi hujjatni
          tyutorga taqdim eting.
        </p>
      </div>
    ),
  },
  {
    id: "qr",
    question: "QR davomat qanday ishlaydi?",
    answer: (
      <div className="space-y-2.5">
        <p>
          <span className="font-medium text-slate-800">Talaba uchun:</span>{" "}
          <a href="/attendance/check-in" className="font-medium text-brand-700 hover:underline">
            /attendance/check-in
          </a>{" "}
          sahifasida 6 belgili kodni kiritasiz yoki QR havolani skanerlaysiz. Tizimga kirmagan
          bo&apos;lsangiz, kiringandan so&apos;ng avtomatik shu sahifaga qaytasiz.
        </p>
        <p>
          <span className="font-medium text-slate-800">O&apos;qituvchi uchun:</span>{" "}
          <a href="/attendance/qr" className="font-medium text-brand-700 hover:underline">
            /attendance/qr
          </a>{" "}
          hubida kursni tanlab sessiya ochasiz, kod va QR ni ko&apos;rsatasiz, katta ekran havolasi
          orqali proyektorga chiqarasiz va belgilanishlarni jonli kuzatasiz.
        </p>
        <p>
          Har bir kod faqat shu dars uchun amal qiladi va davomat bir marta belgilanadi. Telegram
          botda <span className="font-semibold text-slate-800">/qr</span> buyrug&apos;i orqali ham
          belgilashingiz mumkin.
        </p>
      </div>
    ),
  },
  {
    id: "telegram",
    question: "Telegram botga qanday ulanaman?",
    answer: (
      <div className="space-y-2.5">
        <p>
          Telegramda LMS botini toping va{" "}
          <span className="font-semibold text-slate-800">/start</span> buyrug&apos;ini yuboring. Bot
          akkauntni tizimdagi ma&apos;lumotlaringiz bilan bog&apos;laydi.
        </p>
        <p>
          Shundan so&apos;ng jadval va davomat bo&apos;yicha buyruqlar ishlaydi. Batafsil ro&apos;yxat
          quyida —{" "}
          <a href="#bot" className="font-medium text-brand-700 hover:underline">
            Bot buyruqlari
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    id: "sertifikat",
    question: "Sertifikat/transkript qanday olinadi?",
    answer: (
      <div className="space-y-2.5">
        <p>
          Sertifikatlar bo&apos;limida kurs yakunlangach PDF sertifikatni yuklab olish mumkin. Buning
          uchun davomat{" "}
          <span className="font-semibold text-slate-800">80%</span> dan yuqori va yakuniy baho ijobiy
          bo&apos;lishi kerak.
        </p>
        <p>
          Rasmiy transkript kerak bo&apos;lsa,{" "}
          <a
            href="mailto:academic.department@polito.uz"
            className="font-medium text-brand-700 hover:underline"
          >
            academic.department@polito.uz
          </a>{" "}
          manziliga murojaat qiling.
        </p>
      </div>
    ),
  },
  {
    id: "xatolar",
    question: "Xatolar bo'lsa kimga murojaat qilaman?",
    answer: (
      <div className="space-y-2.5">
        <p>
          Xatolik yoki tizim ishlamayotgan bo&apos;lsa,{" "}
          <a
            href="mailto:academic.department@polito.uz"
            className="font-medium text-brand-700 hover:underline"
          >
            academic.department@polito.uz
          </a>{" "}
          manziliga skrinshot va qisqa tavsif bilan yozing.
        </p>
        <p>Shoshilinch masalalar uchun 103-xonadagi tyutorga murojaat qiling.</p>
      </div>
    ),
  },
];

const BOT_COMMANDS: BotCommand[] = [
  {
    command: "/start",
    description: "Bot bilan tanishish va akkauntni ulash",
    result: "Ulanish tasdiqlanadi",
  },
  {
    command: "/jadval",
    description: "Bugungi dars jadvali",
    result: "Kunlik jadval ro'yxati",
  },
  {
    command: "/ertaga",
    description: "Ertangi kungi darslar",
    result: "Ertangi jadval",
  },
  {
    command: "/hafta",
    description: "Haftalik dars jadvali",
    result: "7 kunlik jadval",
  },
  {
    command: "/davomat",
    description: "Davomat foizi va so'nggi belgilar",
    result: "80% qoidasi bo'yicha holat",
  },
  {
    command: "/qr",
    description: "QR davomat: talaba kod kiritadi, o'qituvchi sessiya ochadi",
    result: "Belgilanish yoki sessiya havolasi",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Yordam"
        title="Yordam markazi"
        subtitle="TTPU LMS bo'yicha qo'llanmalar, savol-javoblar va aloqa ma'lumotlari"
      />

      <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-5 py-8 shadow-lift md:px-8 md:py-10">
        <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-brand-500/25 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
            TTPU LMS qo&apos;llanmasi
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Kerakli javob bir necha bosishda
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-200">
            Qo&apos;llanmalar, ko&apos;p so&apos;raladigan savollar, bot buyruqlari va aloqa
            ma&apos;lumotlari — barchasi shu sahifada.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/10 hover:ring-white/20"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-100 ring-1 ring-white/10 transition-colors group-hover:text-gold-300">
                  <HelpIcon name={link.icon} size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{link.label}</span>
                  <span className="block truncate text-xs text-brand-200">{link.hint}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-14">
        <QuickStart steps={STEPS} />
        <FaqList items={FAQ} />
        <BotCommands commands={BOT_COMMANDS} />
        <ContactCards />
      </div>

      <p className="pt-10 text-center text-xs text-slate-400">
        Ma&apos;lumot sentabr 2026 holatiga ko&apos;ra yangilangan. Takliflar uchun:{" "}
        <a href="mailto:academic.department@polito.uz" className="hover:text-brand-600 hover:underline">
          academic.department@polito.uz
        </a>
      </p>
    </>
  );
}
