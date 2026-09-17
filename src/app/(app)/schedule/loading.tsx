import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function ScheduleLoading() {
  return (
    <div>
      <div className="mb-6">
        <Bar className="h-7 w-44" />
        <Bar className="mt-2 h-4 w-64" />
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3 px-5 py-4">
          <div className="w-full sm:w-64">
            <Bar className="h-4 w-16" />
            <Bar className="mt-2 h-9 w-full rounded-lg" />
          </div>
          <Bar className="h-9 w-32 rounded-lg" />
          <Bar className="h-3 w-20" />
        </div>
      </Card>

      <Card className="mt-4">
        <div className="border-b border-slate-100 px-5 py-4">
          <Bar className="h-5 w-36" />
        </div>
        <div className="overflow-x-auto px-5 py-4">
          <div className="min-w-[900px] space-y-3">
            <div className="grid grid-cols-7 gap-3">
              <Bar className="h-4 w-16" />
              {Array.from({ length: 6 }).map((_, index) => (
                <Bar key={index} className="h-4 w-20" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, row) => (
              <div key={row} className="grid grid-cols-7 gap-3">
                <div>
                  <Bar className="h-4 w-16" />
                  <Bar className="mt-2 h-3 w-20" />
                </div>
                {Array.from({ length: 6 }).map((__, col) => (
                  <div key={col} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
