import Link from "next/link";
import { Card } from "@/components/ui";
import { HelpIcon } from "./icons";
import type { HelpIconName } from "./icons";
import { HelpSection } from "./section";

export type QuickStartStep = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: HelpIconName;
};

export function QuickStart({ steps }: { steps: QuickStartStep[] }) {
  return (
    <HelpSection
      id="boshlash"
      icon="sparkles"
      title="Tez boshlash"
      description="Platformada birinchi qadamlar — 6 ta qisqa qo'llanma."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <Card
            key={step.title}
            className="group relative flex flex-col overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-900 group-hover:text-gold-300 group-hover:ring-brand-800">
                <HelpIcon name={step.icon} size={19} />
              </span>
              <span className="bg-gradient-to-br from-slate-300 via-slate-200 to-slate-100 bg-clip-text text-2xl font-semibold tracking-tight text-transparent transition-all duration-300 group-hover:from-gold-400 group-hover:via-brand-400 group-hover:to-brand-300">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-brand-900">
              {step.title}
            </h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{step.description}</p>
            <Link
              href={step.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-900"
            >
              {step.linkLabel}
              <HelpIcon
                name="arrowRight"
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </Card>
        ))}
      </div>
    </HelpSection>
  );
}
