import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function QuizzesLoading() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Bar className="h-7 w-32" />
          <Bar className="mt-2 h-4 w-60" />
        </div>
        <Bar className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Bar className="h-4 w-2/3" />
                <Bar className="mt-2 h-3 w-1/3" />
                <Bar className="mt-3 h-5 w-24 rounded-full" />
              </div>
              <div className="relative size-[88px] shrink-0 animate-pulse rounded-full border-8 border-slate-200 bg-slate-100" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Bar className="h-6 w-20 rounded-lg" />
              <Bar className="h-6 w-24 rounded-lg" />
              <Bar className="h-6 w-20 rounded-lg" />
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
              <Bar className="h-7 w-20 rounded-lg" />
              <Bar className="h-7 w-24 rounded-lg" />
              <Bar className="ml-auto h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
