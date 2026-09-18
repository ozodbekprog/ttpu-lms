import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function CertificatesLoading() {
  return (
    <div className="animate-fade-in">
      <span className="mb-4 block h-1 w-16 animate-shimmer rounded-full bg-gradient-to-r from-brand-900 to-gold-400" />

      <div className="mb-6">
        <Bar className="h-7 w-52" />
        <Bar className="mt-2 h-4 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start gap-3">
              <Bar className="size-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <Bar className="h-4 w-2/3" />
                <Bar className="mt-2 h-3 w-1/3" />
              </div>
            </div>
            <Bar className="mt-4 h-3 w-full" />
            <Bar className="mt-2 h-3 w-4/5" />
            <div className="mt-4 flex items-center justify-between">
              <Bar className="h-6 w-20 rounded-lg" />
              <Bar className="h-4 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
