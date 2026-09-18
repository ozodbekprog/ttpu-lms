import type { ReactNode } from "react";
import { HelpIcon } from "./icons";
import type { HelpIconName } from "./icons";

export function HelpSection({
  id,
  icon,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: HelpIconName;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <HelpIcon name={icon} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-brand-950">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
