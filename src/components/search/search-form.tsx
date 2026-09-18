import { Button, Input } from "@/components/ui";

export function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/search" method="get" className="mb-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <Input
            name="q"
            defaultValue={defaultValue}
            autoFocus
            placeholder="Kurs, material, topshiriq, test yoki foydalanuvchi qidirish"
            className="h-12 pl-11 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6">
          Qidirish
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-400">Kamida 2 ta belgi kiriting.</p>
    </form>
  );
}
