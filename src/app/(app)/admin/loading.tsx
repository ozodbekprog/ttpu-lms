import { Card, Skeleton } from "@/components/ui";

const BAR_HEIGHTS = [42, 68, 34, 80, 56, 72, 48, 62];

export default function AdminLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="relative overflow-hidden p-5">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-30" />
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3.5 w-52" />
          </div>
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3.5 w-40" />
          </div>
          <div className="px-6 py-5">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="mt-4 h-9 w-full rounded-xl" />
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-4 w-72" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-20" />
              <div className="border-b border-slate-100 px-6 py-4">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="mt-2 h-3.5 w-60" />
              </div>
              <div className="px-6 py-5">
                <div className="flex h-52 items-end gap-2">
                  {BAR_HEIGHTS.map((height, barIndex) => (
                    <div
                      key={barIndex}
                      className="flex-1"
                      style={{ height: `${Math.max(18, height - index * 6)}%` }}
                    >
                      <Skeleton className={index % 2 === 0 ? "h-full w-full rounded-t-lg" : "h-full w-full rounded-lg"} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
