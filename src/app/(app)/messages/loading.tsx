import { Card, Skeleton } from "@/components/ui";

export default function MessagesLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>

      <Card className="flex h-[calc(100vh-15rem)] min-h-[480px] overflow-hidden">
        <div className="hidden w-80 flex-col gap-4 border-r border-slate-100 p-4 md:flex lg:w-96">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Skeleton className="h-32 w-full max-w-sm rounded-3xl" />
        </div>
      </Card>
    </div>
  );
}
