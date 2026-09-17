import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function CoursesLoading() {
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Bar className="h-7 w-40" />
          <Bar className="mt-2 h-4 w-56" />
        </div>
        <Bar className="h-9 w-28 rounded-xl" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-24 animate-pulse bg-slate-200" />
            <div className="p-5">
              <Bar className="h-4 w-3/4" />
              <div className="mt-3 flex items-center gap-2">
                <div className="size-9 animate-pulse rounded-full bg-slate-200" />
                <Bar className="h-3 w-1/3" />
              </div>
              <Bar className="mt-3 h-3 w-full" />
              <Bar className="mt-1.5 h-3 w-2/3" />
              <div className="mt-4 flex gap-4">
                <Bar className="h-3 w-24" />
                <Bar className="h-3 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
