import { Skeleton } from "@/components/ui";

export default function GpaLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_21rem]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
