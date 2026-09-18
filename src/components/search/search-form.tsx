import { Button, Input } from "@/components/ui";

const SEARCH_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/search" method="get" className="mb-7">
      <div className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-2.5 shadow-card transition-all duration-200 focus-within:border-brand-300 focus-within:shadow-lift focus-within:ring-4 focus-within:ring-brand-500/10 sm:p-3">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 transition-colors duration-200 group-focus-within:text-brand-600">
              {SEARCH_ICON}
            </span>
            <Input
              name="q"
              defaultValue={defaultValue}
              autoFocus
              placeholder="Kurs, material, topshiriq, test yoki foydalanuvchi qidirish"
              className="h-12 pl-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 gap-2 px-6">
            {SEARCH_ICON}
            Qidirish
          </Button>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs text-slate-400">Kamida 2 ta belgi kiriting.</p>
        <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-500">
            Enter
          </kbd>
          bilan qidirish
        </p>
      </div>
    </form>
  );
}
