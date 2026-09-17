import { Card, Skeleton } from "@/components/ui";

export default function AdminLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="px-6 py-5">
            <Skeleton className="h-24" />
          </div>
        </Card>
      </div>
    </div>
  );
}
