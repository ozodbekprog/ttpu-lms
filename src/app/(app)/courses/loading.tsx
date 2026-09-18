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
            <div className="relative h-28 animate-pulse bg-slate-200">
              <div className="absolute bottom-4 left-4 size-11 animate-pulse rounded-2xl bg-slate-300/70" />
            </div>
            <div className="p-5">
              <Bar className="h-4 w-3/4" />
              <div className="mt-3 flex items-center gap-2">
                <div className="size-8 animate-pulse rounded-full bg-slate-200" />
                <Bar className="h-3 w-1/3" />
              </div>
              <Bar className="mt-3 h-3 w-full" />
              <Bar className="mt-1.5 h-3 w-2/3" />
              <div className="mt-5 flex gap-2">
                <Bar className="h-6 w-28 rounded-full" />
                <Bar className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
