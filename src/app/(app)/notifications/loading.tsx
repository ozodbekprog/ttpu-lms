import { Card, Skeleton } from "@/components/ui";

export default function NotificationsLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="relative">
        <span className="absolute bottom-4 left-4 top-4 w-px bg-slate-200/70" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="relative pb-4 pl-12">
            <Skeleton className="absolute left-0 top-4 size-8 rounded-full" />
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="mt-3 h-4 w-2/5" />
              <Skeleton className="mt-2 h-3 w-4/5" />
              <Skeleton className="mt-3 h-3 w-20" />
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
