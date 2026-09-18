import { Badge, Card, CardBody } from "@/components/ui";
import type { StudentGpa } from "@/app/api/gpa/data";
import { GpaRing } from "./gpa-ring";

function gpaStatus(gpa: number) {
  if (gpa >= 3.5) return { label: "A'lo natija", tone: "green" };
  if (gpa >= 3.0) return { label: "Yaxshi natija", tone: "blue" };
  if (gpa >= 2.0) return { label: "Qoniqarli", tone: "amber" };
  return { label: "Qoniqarsiz", tone: "rose" };
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-xs font-medium text-brand-200">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

export function GpaHero({ data, delay = 0 }: { data: StudentGpa; delay?: number }) {
  if (data.gpa == null) return null;
  const status = gpaStatus(data.gpa);

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
        <span className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-gold-400/10 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-brand-500/20 blur-3xl" />
        <CardBody className="relative grid items-center gap-8 py-8 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <div className="flex justify-center">
            <GpaRing gpa={data.gpa} variant="dark" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
              Umumiy GPA
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                {data.gpa.toFixed(2)}
              </h2>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            <p className="mt-2 max-w-xl text-sm text-brand-200">
              Har kurs o&apos;rtacha foizidan 4.0 tizim bo&apos;yicha hisoblanadi. Baholangan
              topshiriq va testlar asosida, davomat hisobga olinmaydi.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroStat label="Kurslar" value={data.courses.length} />
              <HeroStat label="Kreditlar" value={data.totalCredits} />
              <HeroStat
                label="O'rtacha"
                value={data.overallPercent != null ? `${data.overallPercent}%` : "—"}
              />
              <HeroStat label="Baholangan" value={data.gradedCount} />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
