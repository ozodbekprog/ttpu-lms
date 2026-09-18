import type { ReactNode } from "react";
import { HelpIcon } from "./icons";
import { HelpSection } from "./section";

export type FaqItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <HelpSection
      id="faq"
      icon="help"
      title="Ko'p so'raladigan savollar"
      description="Eng ko'p uchraydigan savollarga qisqa javoblar."
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={item.id}
            id={item.id}
            className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(29,52,96,0.14)] transition-shadow open:shadow-lift"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-medium text-slate-800 transition-colors group-open:text-brand-900">
                  {item.question}
                </span>
              </span>
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-open:rotate-180 group-open:bg-brand-50 group-open:text-brand-700">
                <HelpIcon name="chevron" size={16} />
              </span>
            </summary>
            <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </HelpSection>
  );
}
