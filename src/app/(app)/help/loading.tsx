import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function HelpLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-52" />
        <Bar className="mt-2 h-4 w-80" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Bar className="size-10 rounded-xl" />
            <Bar className="mt-3 h-4 w-2/3" />
            <Bar className="mt-2 h-3 w-1/2" />
          </Card>
        ))}
      </div>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <Bar className="h-5 w-44" />
        </div>
        <div className="space-y-4 px-6 py-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index}>
              <Bar className="h-4 w-2/3" />
              <Bar className="mt-2 h-3 w-full" />
              <Bar className="mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
