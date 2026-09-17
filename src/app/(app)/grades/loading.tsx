import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function GradesLoading() {
  return (
    <div>
      <div className="mb-6">
        <Bar className="h-7 w-48" />
        <Bar className="mt-2 h-4 w-32" />
      </div>

      <Card className="p-6">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center">
          <div>
            <Bar className="h-4 w-28" />
            <Bar className="mt-3 h-11 w-24" />
            <Bar className="mt-2 h-3 w-36" />
          </div>
          <div className="space-y-4">
            <Bar className="h-2 w-full rounded-full" />
            <Bar className="h-4 w-64" />
          </div>
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
