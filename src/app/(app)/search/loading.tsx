import { Card, Skeleton } from "@/components/ui";

function ResultSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
      <Skeleton className="size-9 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

export default function SearchLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>

      <Skeleton className="mb-7 h-[4.55rem] w-full rounded-3xl" />

      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, section) => (
          <Card key={section} className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <Skeleton className="size-9 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, row) => (
                <ResultSkeleton key={row} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
