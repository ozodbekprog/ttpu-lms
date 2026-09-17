import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <Bar className="h-7 w-56" />
        <Bar className="mt-2 h-4 w-40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Bar className="h-4 w-20" />
            <Bar className="mt-3 h-7 w-14" />
            <Bar className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <Bar className="h-5 w-36" />
        </div>
        <div className="space-y-4 px-5 py-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Bar className="h-4 w-1/4" />
              <Bar className="h-4 w-1/3" />
              <Bar className="h-4 w-20" />
              <Bar className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
