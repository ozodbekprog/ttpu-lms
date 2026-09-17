import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function AdminLoading() {
  return (
    <div>
      <div className="mb-6">
        <Bar className="h-7 w-48" />
        <Bar className="mt-2 h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Bar className="h-4 w-24" />
            <Bar className="mt-3 h-7 w-14" />
            <Bar className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <Bar className="h-5 w-36" />
          </div>
          <div className="space-y-2 px-5 py-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-100 p-3">
                <Bar className="h-4 w-1/3" />
                <Bar className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <Bar className="h-5 w-28" />
            <Bar className="mt-2 h-3 w-72" />
          </div>
          <div className="px-5 py-4">
            <div className="h-32 animate-pulse rounded-xl border border-dashed border-slate-300 bg-slate-50" />
          </div>
        </Card>
      </div>
    </div>
  );
}
