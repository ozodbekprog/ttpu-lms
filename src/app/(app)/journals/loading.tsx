import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function JournalsLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-44" />
        <Bar className="mt-2 h-4 w-64" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Bar className="h-4 w-24" />
            <Bar className="mt-3 h-7 w-14" />
            <Bar className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <Bar className="h-5 w-36" />
        </div>
        <div className="space-y-4 px-6 py-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Bar className="h-4 w-14" />
              <Bar className="h-4 w-1/4" />
              <Bar className="h-4 w-1/3" />
              <Bar className="ml-auto h-6 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
