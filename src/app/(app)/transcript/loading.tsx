import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function TranscriptLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-64" />
        <Bar className="mt-2 h-4 w-72" />
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-64">
            <Bar className="h-4 w-20" />
            <Bar className="mt-2 h-10 w-full rounded-xl" />
          </div>
          <Bar className="h-10 w-28 rounded-xl" />
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <Bar className="h-5 w-40" />
        </div>
        <div className="space-y-4 px-6 py-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Bar className="h-4 w-1/4" />
              <Bar className="h-4 w-1/3" />
              <Bar className="h-4 w-20" />
              <Bar className="ml-auto h-6 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
