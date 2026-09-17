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

      <Card>
        <div className="space-y-3 px-5 py-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-4"
            >
              <div className="min-w-0 flex-1">
                <Bar className="h-4 w-1/2" />
                <Bar className="mt-2 h-3 w-1/4" />
              </div>
              <Bar className="h-5 w-24 rounded-full" />
              <Bar className="h-3 w-16" />
              <Bar className="h-3 w-16" />
              <div className="flex gap-2">
                <Bar className="h-7 w-20 rounded-lg" />
                <Bar className="h-7 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
