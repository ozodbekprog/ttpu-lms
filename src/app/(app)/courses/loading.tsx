import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function CoursesLoading() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Bar className="h-7 w-40" />
          <Bar className="mt-2 h-4 w-56" />
        </div>
        <Bar className="h-9 w-28 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-20 animate-pulse bg-slate-200" />
            <div className="px-5 py-4">
              <Bar className="h-4 w-3/4" />
              <Bar className="mt-2 h-3 w-1/2" />
              <Bar className="mt-3 h-3 w-full" />
              <Bar className="mt-1.5 h-3 w-2/3" />
              <Bar className="mt-4 h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
