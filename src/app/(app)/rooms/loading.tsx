import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function RoomsLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-44" />
        <Bar className="mt-2 h-4 w-32" />
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap gap-3">
          <Bar className="h-10 w-full rounded-xl sm:max-w-xs" />
          <Bar className="h-10 w-40 rounded-xl" />
          <Bar className="h-10 w-28 rounded-xl" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Bar className="h-5 w-2/3" />
                <Bar className="mt-2 h-3 w-1/2" />
              </div>
              <Bar className="h-6 w-16 rounded-lg" />
            </div>
            <Bar className="mt-4 h-3 w-full" />
            <Bar className="mt-2 h-3 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  );
}
