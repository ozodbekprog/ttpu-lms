import { Avatar, Card, CardBody, CardHeader, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/grades/grade-badge";
import type { RankedRating } from "@/components/grades/rating";

const RANK_TONES: Record<number, string> = {
  1: "bg-gold-400 text-white shadow-sm shadow-gold-400/40",
  2: "bg-slate-300 text-slate-700 shadow-sm shadow-slate-300/40",
  3: "bg-amber-700 text-white shadow-sm shadow-amber-700/40",
};

const ROW_TONES: Record<number, string> = {
  1: "bg-gold-300/10",
  2: "bg-slate-50",
  3: "bg-amber-50/60",
};

function RatingRow({ row }: { row: RankedRating }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 sm:px-6",
        ROW_TONES[row.rank],
        row.isMe && "bg-brand-50/80",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
          RANK_TONES[row.rank] ?? "bg-slate-100 text-slate-500",
        )}
      >
        {row.rank}
      </span>
      <Avatar name={row.name} src={row.avatarUrl} className="size-8! text-[10px]" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium text-slate-800",
          row.isMe && "text-brand-900",
        )}
      >
        {row.name}
        {row.isMe ? (
          <span className="ml-1.5 text-[10px] font-semibold text-brand-600">(siz)</span>
        ) : null}
      </span>
      <GradeBadge percent={row.percent} size="sm" />
    </li>
  );
}

export function RatingPanel({
  rows,
  groupName,
}: {
  rows: RankedRating[];
  groupName: string | null;
}) {
  const top = rows.slice(0, 10);
  const me = rows.find((row) => row.isMe) ?? null;
  const showMe = me != null && me.rank > 10;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Reyting"
        subtitle={
          groupName
            ? `${groupName} guruhi · baholangan ishlar bo'yicha o'rtacha`
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
          <ol className="divide-y divide-slate-100">
            {top.map((row) => (
              <RatingRow key={row.studentId} row={row} />
            ))}
            {showMe && me ? (
              <>
                <li className="py-1 text-center text-xs font-semibold text-slate-400">···</li>
                <RatingRow row={me} />
              </>
            ) : null}
          </ol>
        </CardBody>
      )}
    </Card>
  );
}
