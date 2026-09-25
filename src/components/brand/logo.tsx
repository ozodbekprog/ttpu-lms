import { cn } from "@/lib/utils";

export function Logo({
  size = 36,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo.svg"
        alt="TTPU"
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
      />
      {withText ? (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight text-brand-900">TTPU LMS</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
            Turin Polytechnic
          </span>
        </span>
      ) : null}
    </span>
  );
}
