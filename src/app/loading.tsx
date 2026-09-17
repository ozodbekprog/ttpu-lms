import { Logo } from "@/components/brand/logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50 via-surface to-white" />
      <div className="pointer-events-none absolute -left-24 top-1/4 size-80 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 size-72 rounded-full bg-gold-300/20 blur-3xl" />

      <div className="relative flex animate-fade-in flex-col items-center px-6">
        <div className="relative flex size-40 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full border border-brand-300/70" />
          <svg
            viewBox="0 0 160 160"
            fill="none"
            aria-hidden="true"
            className="absolute inset-0 size-full animate-spin-slow text-brand-700"
          >
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 10"
            />
          </svg>
          <Logo size={72} withText={false} />
        </div>

        <h1 className="mt-7 animate-shimmer text-xl font-bold tracking-tight text-brand-950">
          TTPU LMS
        </h1>
        <p className="mt-1 animate-shimmer text-sm font-medium text-slate-500">Yuklanmoqda...</p>

        <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-slate-200/70">
          <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        </div>
      </div>
    </div>
  );
}
