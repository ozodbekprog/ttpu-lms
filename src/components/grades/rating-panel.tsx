import { Avatar, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/grades/grade-badge";
import type { RankedRating } from "@/components/grades/rating";

const PODIUM_META: Record<
  number,
  { bar: string; num: string; height: string; delay: string; label: string }
> = {
  1: {
    bar: "bg-gradient-to-t from-gold-600 via-gold-400 to-gold-300",
    num: "bg-white/70 text-brand-950",
    height: "h-24 sm:h-36",
    delay: "140ms",
    label: "Chempion",
  },
  2: {
    bar: "bg-gradient-to-t from-slate-500 via-slate-300 to-slate-200",
    num: "bg-white/50 text-slate-700",
    height: "h-16 sm:h-24",
    delay: "40ms",
    label: "Kumush",
  },
  3: {
    bar: "bg-gradient-to-t from-amber-800 via-amber-600 to-amber-400",
    num: "bg-white/25 text-white",
    height: "h-12 sm:h-20",
    delay: "240ms",
    label: "Bronza",
  },
};

const ORDER: Record<number, string> = {
  1: "order-2",
  2: "order-1",
  3: "order-3",
};

const RANK_TONES: Record<number, string> = {
  1: "bg-gradient-to-br from-gold-300 to-gold-500 text-brand-950 shadow-sm shadow-gold-400/40",
  2: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 shadow-sm shadow-slate-300/40",
  3: "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm shadow-amber-600/40",
};

function TrophyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3" />
      <path d="M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 14v3" />
      <path d="M8 21h8" />
      <path d="M10 17h4v4h-4z" />
    </svg>
  );
}

function RatingRow({ row, delay }: { row: RankedRating; delay: number }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors duration-150 animate-fade-up hover:bg-slate-50/70 sm:px-6",
        row.isMe && "bg-brand-50/80 hover:bg-brand-50",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
          RANK_TONES[row.rank] ?? "bg-slate-100 text-slate-500",
        )}
      >
        {row.rank}
      </span>
      <Avatar name={row.name} src={row.avatarUrl} className="size-9! text-[10px]" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium text-slate-800",
          row.isMe && "text-brand-900",
        )}
      >
        {row.name}
        {row.isMe ? (
          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
            siz
          </span>
        ) : null}
      </span>
      <GradeBadge percent={row.percent} size="sm" />
    </li>
  );
}

function Podium({ rows }: { rows: RankedRating[] }) {
  return (
    <ol className="flex items-end gap-2 px-3 pt-6 pb-2 sm:gap-5 sm:px-6 sm:pt-8">
      {rows.map((row, index) => {
        const place = index + 1;
        const meta = PODIUM_META[place];
        const isFirst = place === 1;
        return (
          <li
            key={row.studentId}
            className={cn("flex min-w-0 flex-1 flex-col items-center", ORDER[place])}
          >
            <div
              className="flex w-full flex-col items-center animate-fade-up"
              style={{ animationDelay: meta.delay }}
            >
              <span className="relative inline-flex">
                {isFirst ? (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-gold-700">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m12 2 2.6 6.6L21 9.2l-4.7 4.1 1.4 6.7L12 16.6 6.3 20l1.4-6.7L3 9.2l6.4-.6Z" />
                    </svg>
                  </span>
                ) : null}
                <Avatar
                  name={row.name}
                  src={row.avatarUrl}
                  className={cn(
                    "size-11! text-xs ring-2 sm:size-16! sm:text-base",
                    isFirst
                      ? "ring-gold-400 shadow-lg shadow-gold-400/30"
                      : place === 2
                        ? "ring-slate-300"
                        : "ring-amber-600/70",
                    row.isMe && "ring-brand-500",
                  )}
                />
              </span>
              <p className="mt-2.5 w-full truncate text-center text-xs font-semibold text-slate-800 sm:text-sm">
                {row.name}
              </p>
              <p className="text-[11px] font-semibold tabular-nums text-slate-500 sm:text-xs">
                {row.percent}%
              </p>
              {row.isMe ? (
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                  siz
                </span>
              ) : (
                <span className="mt-1 hidden text-[10px] uppercase tracking-wide text-slate-500 sm:block">
                  {meta.label}
                </span>
              )}
            </div>
            <div
              className={cn(
                "mt-3 flex w-full origin-bottom items-start justify-center rounded-t-2xl pt-2 animate-grow-y sm:pt-3",
                meta.bar,
                meta.height,
              )}
              style={{ animationDelay: meta.delay }}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm font-bold backdrop-blur-sm sm:size-8",
                  meta.num,
                )}
              >
                {row.rank}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RatingPanel({
  rows,
  groupName,
}: {
  rows: RankedRating[];
  groupName: string | null;
}) {
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 13);
  const hidden = rows.length - 3 - rest.length;
  const me = rows.find((row) => row.isMe) ?? null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gold-300/25 text-gold-800">
              <TrophyIcon />
            </span>
            Reyting
          </span>
        }
        subtitle={
          groupName
            ? `${groupName} guruhi · ${rows.length} talaba · baholangan ishlar bo'yicha`
            : "Guruh bo'yicha o'rtacha ko'rsatkich"
        }
      />
      {rows.length === 0 ? (
        <CardBody>
          <EmptyState
            title="Reyting uchun ma'lumot yetarli emas"
            description="Baholangan topshiriq yoki test urinishlari paydo bo'lgach reyting shu yerda ko'rinadi."
          />
        </CardBody>
      ) : (
        <CardBody className="p-0">
          <Podium rows={podium} />
          {rest.length > 0 ? (
            <ol className="divide-y divide-slate-100 border-t border-slate-100">
              {rest.map((row, index) => (
                <RatingRow key={row.studentId} row={row} delay={index * 35} />
              ))}
              {hidden > 0 ? (
                <li className="py-2 text-center text-xs font-semibold tracking-widest text-slate-500">
                  ···
                </li>
              ) : null}
            </ol>
          ) : null}
          {me ? (
            <div className="sticky bottom-4 z-20 px-4 pb-4 sm:px-6">
              <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white/95 p-3 shadow-[0_10px_30px_-12px_rgba(29,52,96,0.45)] backdrop-blur animate-fade-up">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-900 to-brand-600 text-xs font-bold tabular-nums text-white">
                  #{me.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-950">
                    Siz: #{me.rank}, {me.percent}%
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {rows.length} talaba ichida{groupName ? ` · ${groupName}` : ""}
                  </p>
                </div>
                <GradeBadge percent={me.percent} size="md" />
              </div>
            </div>
          ) : null}
        </CardBody>
      )}
    </Card>
  );
}
