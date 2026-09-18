import { Card, Skeleton } from "@/components/ui";

export default function ElectivesLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-16 rounded-b-none" />
            <div className="space-y-3 px-6 py-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-8 w-28" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
