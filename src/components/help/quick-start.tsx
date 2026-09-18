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
            className="group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100">
                <HelpIcon name={step.icon} size={19} />
              </span>
              <span className="text-2xl font-semibold tracking-tight text-slate-200 transition-colors group-hover:text-brand-300">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 font-semibold tracking-tight text-slate-900">{step.title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{step.description}</p>
            <Link
              href={step.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-900"
            >
              {step.linkLabel}
              <HelpIcon name="arrowRight" size={15} />
            </Link>
          </Card>
        ))}
      </div>
    </HelpSection>
  );
}
