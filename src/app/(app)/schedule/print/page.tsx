import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState } from "@/components/ui";
import { cn, dayName } from "@/lib/utils";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { PrintButton } from "./print-button";
import { addDays, dayMonth, isoWeekNumber, mondayOfIso, tashkentToday, weekLabel } from "./week";

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_LABELS: Record<string, string> = {
  CHANGED: "O'zgartirilgan",
  MOVED: "Ko'chirilgan",
  CANCELLED: "Bekor",
};

const STATUS_STRIPE: Record<string, string> = {
  NORMAL: "border-l-brand-300",
  CHANGED: "border-l-amber-400",
  MOVED: "border-l-sky-400",
  CANCELLED: "border-l-rose-400",
};

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 8mm; }
  aside, header, nav, .no-print { display: none !important; }
  body { background: #fff !important; }
  main { margin: 0 !important; max-width: none !important; padding: 0 !important; }
  .print-body { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 3mm 0 0 !important; }
  .print-table { font-size: 9.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-table tr { break-inside: avoid; }
  .print-table th { background: #f1f5f9 !important; }
  .print-stripe { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export default async function SchedulePrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const staff = isStaff(user.role);

  const groups = staff
    ? await prisma.group.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : user.group
      ? [{ id: user.group.id, name: user.group.name }]
      : [];

  const requested = typeof params.groupId === "string" ? params.groupId : null;
  const group = groups.find((item) => item.id === requested) ?? groups[0] ?? null;
  const weekParam = typeof params.week === "string" ? params.week : null;
  const monday = mondayOfIso(weekParam ?? tashkentToday());

  if (!group) {
    return (
      <EmptyState
        title="Guruh topilmadi"
        description="Jadvalni chop etish uchun sizga guruh biriktirilgan bo'lishi kerak."
      />
    );
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: { groupId: group.id },
    orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
  });

  const weekNumber = isoWeekNumber(monday);
  const parityLabel = weekNumber % 2 === 0 ? "Juft hafta" : "Toq hafta";
  const todayIso = tashkentToday();

  function entriesAt(day: number, slot: number) {
    return entries.filter((entry) => entry.dayOfWeek === day && entry.slot === slot);
  }

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <PrintButton />
        <ButtonLink
          href={`/schedule?groupId=${encodeURIComponent(group.id)}`}
          variant="secondary"
        >
          Jadval sahifasiga qaytish
        </ButtonLink>
      </div>

      <div className="print-body relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3.5">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm ring-2 ring-brand-50">
              <img src="/logo.svg" alt="TTPU" width={44} height={44} className="h-full w-full" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">TTPU LMS</p>
              <p className="text-lg font-semibold tracking-tight text-brand-950">Dars jadvali</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {group.name} guruhi · {weekLabel(monday)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">Chop etilgan: {todayIso}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {`${weekNumber}-hafta · ${parityLabel}`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="print-table w-full min-w-[900px] border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="w-24 border border-slate-300 bg-slate-100 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Par
                </th>
                {DAYS.map((day) => {
                  const dayIso = addDays(monday, day - 1);
                  const isToday = dayIso === todayIso;
                  return (
                    <th
                      key={day}
                      className={cn(
                        "border border-slate-300 px-2 py-1.5 text-left",
                        isToday ? "bg-amber-50" : "bg-slate-100",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{dayName(day)}</span>
                        {isToday ? (
                          <span className="rounded-full bg-amber-200/70 px-1.5 py-px text-[9px] font-semibold text-amber-800">
                            bugun
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-[10px] font-normal text-slate-500">
                        {dayMonth(dayIso)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="align-top">
                  <td className="border border-slate-300 px-2 py-1.5">
                    <span className="block font-semibold text-slate-800">{slot}-par</span>
                    <span className="block text-[10px] text-slate-500">{SLOT_TIMES[slot]}</span>
                  </td>
                  {DAYS.map((day) => {
                    const dayIso = addDays(monday, day - 1);
                    const isToday = dayIso === todayIso;
                    return (
                      <td
                        key={day}
                        className={cn("border border-slate-300 px-2 py-1.5", isToday && "bg-amber-50/40")}
                      >
                        <div className="space-y-1.5">
                          {entriesAt(day, slot).map((entry) => {
                            const cancelled = entry.status === "CANCELLED";
                            const statusLabel = STATUS_LABELS[entry.status];
                            const entryParity =
                              entry.parity === "odd"
                                ? "Toq hafta"
                                : entry.parity === "even"
                                  ? "Juft hafta"
                                  : null;
                            return (
                              <div
                                key={entry.id}
                                className={cn(
                                  "print-stripe border-b border-l-2 border-dashed border-slate-200 pb-1.5 pl-2 last:border-b-0 last:pb-0",
                                  STATUS_STRIPE[entry.status] ?? STATUS_STRIPE.NORMAL,
                                )}
                              >
                                <p
                                  className={
                                    cancelled
                                      ? "font-semibold text-slate-600 line-through"
                                      : "font-semibold text-slate-900"
                                  }
                                >
                                  {entry.subject}
                                </p>
                                {entry.teacher ? (
                                  <p className="text-[10px] text-slate-500">{entry.teacher}</p>
                                ) : null}
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  {entry.room ? (
                                    <span className="rounded border border-slate-200 bg-white px-1 py-px text-[9px] text-slate-600">
                                      {entry.room}
                                    </span>
                                  ) : null}
                                  {entryParity ? (
                                    <span className="rounded border border-amber-300 bg-amber-50 px-1 py-px text-[9px] text-amber-700">
                                      {entryParity}
                                    </span>
                                  ) : null}
                                  {statusLabel ? (
                                    <span
                                      className={
                                        cancelled
                                          ? "rounded border border-rose-300 bg-rose-50 px-1 py-px text-[9px] font-semibold text-rose-700"
                                          : entry.status === "MOVED"
                                            ? "rounded border border-sky-300 bg-sky-50 px-1 py-px text-[9px] text-sky-700"
                                            : "rounded border border-amber-300 bg-amber-50 px-1 py-px text-[9px] text-amber-700"
                                      }
                                    >
                                      {statusLabel}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
