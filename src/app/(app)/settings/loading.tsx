import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function SettingsLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-44" />
        <Bar className="mt-2 h-4 w-72" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, card) => (
          <Card key={card}>
            <div className="border-b border-slate-100 px-6 py-4">
              <Bar className="h-5 w-40" />
              <Bar className="mt-2 h-3 w-56" />
            </div>
            <div className="space-y-5 px-6 py-5">
              {Array.from({ length: 2 }).map((_, row) => (
                <div key={row} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Bar className="h-4 w-1/3" />
                    <Bar className="mt-2 h-3 w-1/2" />
                  </div>
                  <Bar className="h-8 w-24 rounded-xl" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
