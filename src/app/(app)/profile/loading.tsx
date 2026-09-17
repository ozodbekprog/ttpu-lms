import { Card, CardBody, Skeleton } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit overflow-hidden">
          <Skeleton className="h-20 rounded-b-none" />
          <CardBody className="-mt-12 flex flex-col items-center gap-3">
            <Skeleton className="size-20 rounded-full ring-4 ring-white" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="mt-1 h-16 w-full" />
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <div className="border-b border-slate-100 px-6 py-4">
                <Skeleton className="h-5 w-48" />
              </div>
              <CardBody className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-32" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
