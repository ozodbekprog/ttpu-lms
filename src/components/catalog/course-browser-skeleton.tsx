import { Card, Skeleton } from "@/components/ui";

export function CourseBrowserSkeleton() {
  return (
    <>
      <Card className="mb-6">
        <div className="flex flex-col gap-3 px-6 py-5">
          <Skeleton className="h-9 w-full sm:w-96" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-24 rounded-b-none" />
            <div className="space-y-3 px-6 py-5">
              <div className="flex items-center gap-3">
                <Skeleton className="-mt-10 size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
