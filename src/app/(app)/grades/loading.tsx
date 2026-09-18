import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function GradesLoading() {
  return (
    <div>
      <div className="mb-7">
        <Bar className="h-7 w-48" />
        <Bar className="mt-2 h-4 w-32" />
      </div>

      <Card className="p-7">
        <div className="grid gap-7 sm:grid-cols-[auto_1fr] sm:items-center">
          <Bar className="mx-auto size-40 rounded-full sm:mx-0" />
          <div className="space-y-4">
            <Bar className="h-4 w-40" />
            <Bar className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Bar key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-6 py-4">
          <Bar className="h-5 w-28" />
          <Bar className="mt-2 h-3 w-48" />
        </div>
        <div className="flex items-end gap-3 px-6 py-7">
          <Bar className="h-20 flex-1 rounded-t-2xl" />
          <Bar className="h-32 flex-1 rounded-t-2xl" />
          <Bar className="h-14 flex-1 rounded-t-2xl" />
        </div>
      </Card>

      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="mt-6">
          <div className="border-b border-slate-100 px-6 py-4">
            <Bar className="h-5 w-40" />
            <Bar className="mt-2 h-3 w-56" />
          </div>
          <div className="space-y-5 px-6 py-5">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="flex items-center gap-4">
                <Bar className="h-8 w-8 rounded-full" />
                <Bar className="h-4 w-40" />
                <Bar className="h-3 w-24" />
                <Bar className="ml-auto h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
