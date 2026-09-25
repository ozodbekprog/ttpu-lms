import { Card, CardBody, CardHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GpaLetter } from "@/app/api/gpa/data";
import { GpaPointsBadge, LetterBadge, LETTER_META } from "./gpa-badge";

const SCALE: { range: string; points: number; letter: GpaLetter }[] = [
  { range: "90–100%", points: 4, letter: "A" },
  { range: "85–89%", points: 3.7, letter: "B" },
  { range: "80–84%", points: 3.3, letter: "B" },
  { range: "75–79%", points: 3, letter: "C" },
  { range: "70–74%", points: 2.7, letter: "C" },
  { range: "65–69%", points: 2.3, letter: "D" },
  { range: "60–64%", points: 2, letter: "D" },
  { range: "0–59%", points: 0, letter: "F" },
];

export function GpaScale({ delay = 0 }: { delay?: number }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="h-full">
        <CardHeader title="4.0 shkala legendasi" subtitle="Foiz → GPA ball → harf baho" />
        <CardBody className="space-y-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3">
            <div className="h-2 rounded-full bg-[linear-gradient(90deg,#fb7185_0%,#f59e0b_30%,#d4af37_55%,#5373b8_78%,#10b981_100%)]" />
            <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
              <span>0.0</span>
              <span>2.0</span>
              <span>3.0</span>
              <span>3.5</span>
              <span>4.0</span>
            </div>
          </div>
          {SCALE.map((row) => {
            const meta = LETTER_META[row.letter];
            return (
              <div
                key={row.range}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 transition-colors duration-150 hover:bg-slate-50/70"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={cn("h-8 w-1 shrink-0 rounded-full", meta.bar)} />
                  <LetterBadge letter={row.letter} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium tabular-nums text-slate-700">
                      {row.range}
                    </span>
                    <span className="block text-[11px] text-slate-600">{meta.label}</span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
                    ball
                  </span>
                  <GpaPointsBadge points={row.points} size="sm" />
                </span>
              </div>
            );
          })}
          <p className="rounded-xl bg-slate-50/70 px-3 py-2 text-center text-[11px] leading-relaxed text-slate-600">
            GPA = Σ (ball × kredit) ÷ Σ kredit · davomat hisobga olinmaydi
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
