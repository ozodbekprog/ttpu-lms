import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

function CourseRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div className="size-10 shrink-0 animate-pulse rounded-xl bg-slate-200" />
      <div className="min-w-0 flex-1">
        <Bar className="h-4 w-2/3" />
        <Bar className="mt-2 h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-6 h-32 animate-pulse rounded-2xl bg-slate-200 md:h-36" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Bar className="h-4 w-20" />
                <Bar className="mt-3 h-7 w-14" />
                <Bar className="mt-2 h-3 w-24" />
              </div>
              <div className="size-10 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <Bar className="h-5 w-28" />
            <Bar className="mt-2 h-3 w-20" />
          </div>
          <div className="space-y-2 px-6 py-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <CourseRow key={index} />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <Bar className="h-5 w-36" />
            </div>
            <div className="space-y-2 px-6 py-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                  <Bar className="h-4 w-11" />
                  <Bar className="size-2.5 rounded-full" />
                  <Bar className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <Bar className="h-5 w-40" />
            </div>
            <div className="space-y-2 px-6 py-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0 flex-1">
                    <Bar className="h-4 w-2/3" />
                    <Bar className="mt-2 h-3 w-1/3" />
                  </div>
                  <Bar className="h-6 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
