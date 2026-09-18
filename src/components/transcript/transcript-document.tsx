import { fmtDate } from "@/lib/utils";
import type { TranscriptData } from "@/components/transcript/transcript-data";

function percent(value: number | null) {
  return value !== null ? `${value}%` : "—";
}

function letterTone(letter: string) {
  if (letter === "A") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (letter === "B") return "bg-brand-50 text-brand-700 ring-brand-200";
  if (letter === "C") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (letter === "D") return "bg-orange-50 text-orange-700 ring-orange-200";
  if (letter === "F") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-50 text-slate-400 ring-slate-200";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function TranscriptDocument({ data }: { data: TranscriptData }) {
  const issuedAt = new Date();

  return (
    <div id="ttpu-transcript" className="mx-auto w-full max-w-[210mm]">
      <div className="transcript-sheet relative overflow-hidden rounded-2xl border-[6px] border-brand-950 bg-white shadow-xl">
        <div className="border-[2px] border-gold-400/70">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-950 px-6 py-5 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <img
                src="/logo.svg"
                alt="TTPU logotipi"
                width={58}
                height={58}
                className="h-14 w-14 shrink-0 rounded-full bg-white p-0.5"
              />
              <div>
                <p className="font-serif text-lg font-semibold leading-tight sm:text-xl">
                  Turin Politexnika Universiteti
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.36em] text-gold-300">
                  TTPU LMS · Rasmiy hujjat
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-serif text-2xl font-bold uppercase tracking-[0.2em] text-gold-300">
                Transkript
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-wider text-white/70">
                {data.serial}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 px-6 py-5 sm:grid-cols-4 sm:px-8">
            <Info label="Talaba" value={data.student.name} />
            <Info label="Guruh" value={data.student.group ?? "—"} />
            <Info
              label="Talaba ID"
              value={`TTPU-${data.student.id.slice(-8).toUpperCase()}`}
            />
            <Info label="Sana" value={fmtDate(issuedAt)} />
          </div>

          <div className="px-6 py-5 sm:px-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-brand-900 text-left text-white">
                  <th className="w-10 rounded-l-lg px-3 py-2.5 text-center text-[11px] font-semibold">
                    #
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">Kurs</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">O&apos;qituvchi</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold">
                    Topshiriqlar
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold">Testlar</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold">Davomat</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold">Yakuniy</th>
                  <th className="w-16 rounded-r-lg px-3 py-2.5 text-center text-[11px] font-semibold">
                    Baho
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-sm text-slate-400">
                      Kurslar mavjud emas
                    </td>
                  </tr>
                ) : (
                  data.courses.map((course, index) => (
                    <tr
                      key={course.courseId}
                      className={index % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
                    >
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-xs tabular-nums text-slate-400">
                        {index + 1}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">
                        {course.title}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">
                        {course.teacher}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {percent(course.assignments)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {percent(course.quizzes)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {percent(course.attendance)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-semibold tabular-nums text-brand-900">
                        {percent(course.final)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ring-1 ${letterTone(course.letter)}`}
                        >
                          {course.letter}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 border-t border-slate-200 px-6 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Umumiy GPA
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-brand-900">
                {data.gpa !== null ? data.gpa.toFixed(2) : "—"}
                <span className="ml-1.5 text-sm font-medium text-slate-400">/ 4.00</span>
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                90+ = 4.0 · 85+ = 3.7 · 80+ = 3.3 · 75+ = 3.0 · 70+ = 2.7 · 65+ = 2.3 · 60+ = 2.0
                · 60 dan past = 0.0
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Harf baho: A 90+, B 80+, C 70+, D 60+, F 60 dan past
              </p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-serif text-sm italic text-slate-600">Registrator</p>
              <div className="mt-3 h-px w-40 bg-slate-400" />
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-slate-400">Imzo</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Seriya raqami
              </p>
              <p className="mt-1 font-mono text-xs tracking-wider text-slate-600">
                {data.serial}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                Berilgan sana: {fmtDate(issuedAt)}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 sm:px-8">
            <p className="text-[10px] leading-relaxed text-slate-400">
              Ushbu transkript TTPU LMS tizimi ma&apos;lumotlari asosida avtomatik
              shakllantirilgan. Faqat imzo va muhr bilan tasdiqlanganda haqiqiy hisoblanadi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
