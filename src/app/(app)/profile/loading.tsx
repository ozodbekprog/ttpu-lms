import { Card, CardBody, Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <Card className="overflow-hidden">
        <Skeleton className="h-48" />
        <div className="flex flex-col items-center px-6 pb-7">
          <Skeleton className="-mt-16 size-28 rounded-full ring-4 ring-white" />
          <Skeleton className="mt-4 h-7 w-44" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-3.5 flex flex-wrap justify-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-16 w-full max-w-2xl rounded-2xl" />
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2.5 h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
              <Skeleton className="size-11 rounded-2xl" />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <div className="border-b border-slate-100 px-6 py-4">
              <Skeleton className="h-5 w-48" />
            </div>
            <CardBody className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-9 w-32" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
