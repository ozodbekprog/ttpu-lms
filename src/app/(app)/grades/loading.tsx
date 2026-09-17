import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function GradesLoading() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Bar className="h-7 w-48" />
          <Bar className="mt-2 h-4 w-32" />
        </div>
        <div className="flex items-end gap-2">
          <Bar className="h-9 w-64 rounded-lg" />
          <Bar className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Bar className="h-4 w-24" />
            <Bar className="mt-3 h-7 w-12" />
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <Bar className="h-5 w-24" />
          <Bar className="mt-2 h-3 w-48" />
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-3">
            <Bar className="h-3 w-28" />
            <Bar className="h-3 w-40" />
            <Bar className="h-3 w-24" />
            <Bar className="h-3 w-20" />
            <Bar className="ml-auto h-3 w-12" />
          </div>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Bar className="h-4 w-32" />
              <Bar className="h-4 w-48" />
              <Bar className="h-3 w-24" />
              <Bar className="h-5 w-20 rounded-full" />
              <Bar className="ml-auto h-4 w-12" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
