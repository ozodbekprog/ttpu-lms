import { Card, CardBody, CardHeader } from "@/components/ui";
import type { GpaLetter } from "@/app/api/gpa/data";
import { GpaPointsBadge, LetterBadge } from "./gpa-badge";

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
        <CardHeader title="Baholash shkalasi" subtitle="Foiz → GPA ball → harf baho" />
        <CardBody className="space-y-2">
          {SCALE.map((row) => (
            <div
              key={row.range}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-600">{row.range}</span>
              <span className="flex items-center gap-2">
                <LetterBadge letter={row.letter} size="sm" />
                <GpaPointsBadge points={row.points} size="sm" />
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
