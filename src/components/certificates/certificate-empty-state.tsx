import { Card } from "@/components/ui";
import type { ReactNode } from "react";

export function CertificateEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
      <div className="relative flex flex-col items-center gap-1 px-6 py-14 text-center">
        <span className="pointer-events-none absolute inset-x-0 -bottom-16 mx-auto size-52 rounded-full bg-brand-50 blur-2xl" />
        <span className="relative mb-2 inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-300/35 via-white to-brand-50 ring-1 ring-gold-400/50">
          <svg
            viewBox="0 0 48 48"
            className="size-9 text-gold-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="cert-empty-seal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e3c76a" />
                <stop offset="100%" stopColor="#a9871f" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="19" r="12" stroke="url(#cert-empty-seal)" strokeWidth="2" />
            <circle cx="24" cy="19" r="7.5" stroke="url(#cert-empty-seal)" strokeWidth="1" strokeDasharray="2.5 2.5" />
            <path d="M18.5 19.5l3.6 3.6 7.4-8" stroke="url(#cert-empty-seal)" strokeWidth="2" />
            <path d="m17 29-2.5 13L24 37l9.5 5L31 29" stroke="url(#cert-empty-seal)" strokeWidth="2" />
          </svg>
        </span>
        <p className="relative font-semibold text-slate-800">{title}</p>
        {description ? (
          <p className="relative max-w-md text-sm text-slate-500">{description}</p>
        ) : null}
        {action ? <div className="relative mt-4">{action}</div> : null}
      </div>
    </Card>
  );
}
