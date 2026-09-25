import { Card } from "@/components/ui";
import { HelpIcon } from "./icons";
import type { HelpIconName } from "./icons";
import { HelpSection } from "./section";

type ContactChannel = {
  icon: HelpIconName;
  title: string;
  value: string;
  href?: string;
  hint: string;
  tone: string;
};

const CONTACTS: ContactChannel[] = [
  {
    icon: "mail",
    title: "O'quv bo'limi",
    value: "academic.department@polito.uz",
    href: "mailto:academic.department@polito.uz",
    hint: "Parol, sertifikat, transkript va o'quv jarayoni bo'yicha murojaatlar",
    tone: "bg-brand-50 text-brand-700 ring-brand-100",
  },
  {
    icon: "mapPin",
    title: "Tyutor",
    value: "103-xona",
    hint: "Davomat, jadval va kundalik masalalar bo'yicha jonli yordam",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
];

const CHECKLIST = [
  "Guruh va fan nomini tayyorlang",
  "Muammoni 1-2 gapda ta'riflang",
  "Xatolik skrinshotini qo'shing",
];

export function ContactCards() {
  return (
    <HelpSection
      id="aloqa"
      icon="mail"
      title="Aloqa"
      description="Javob topilmadimi? Biz bilan bog'laning."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {CONTACTS.map((channel) => (
          <Card
            key={channel.title}
            className="flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
          >
            <span className={`inline-flex size-10 items-center justify-center rounded-xl ring-1 ${channel.tone}`}>
              <HelpIcon name={channel.icon} size={19} />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              {channel.title}
            </p>
            {channel.href ? (
              <a
                href={channel.href}
                className="group/link mt-1 inline-flex items-center gap-1 font-semibold tracking-tight text-brand-800 transition-colors hover:text-brand-950"
              >
                <span className="break-all">{channel.value}</span>
                <HelpIcon
                  name="arrowRight"
                  size={14}
                  className="shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100"
                />
              </a>
            ) : (
              <p className="mt-1 font-semibold tracking-tight text-brand-800">{channel.value}</p>
            )}
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{channel.hint}</p>
          </Card>
        ))}
        <Card className="relative overflow-hidden border-brand-900/40 bg-brand-950 p-5 text-white">
          <span className="absolute -right-10 -top-12 size-36 rounded-full bg-brand-500/25 blur-2xl" />
          <span className="absolute -bottom-14 left-6 size-32 rounded-full bg-gold-400/10 blur-2xl" />
          <div className="relative">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-white/15">
              <HelpIcon name="shield" size={19} />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-200">
              Murojaatdan oldin
            </p>
            <p className="mt-1 font-semibold tracking-tight">Tezkor yechim uchun</p>
            <ul className="mt-3 space-y-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-brand-100">
                  <HelpIcon name="check" size={15} className="mt-0.5 shrink-0 text-gold-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </HelpSection>
  );
}
