import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function ExamsLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-72" />
        <Bar className="mt-2 h-4 w-56" />
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Bar className="h-4 w-24" />
            <Bar className="mt-3 h-7 w-12" />
            <Bar className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <Bar className="h-5 w-36" />
        </div>
        <div className="space-y-3 px-6 py-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
              <Bar className="size-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <Bar className="h-4 w-1/2" />
                <Bar className="mt-2 h-3 w-1/3" />
              </div>
              <Bar className="h-6 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
