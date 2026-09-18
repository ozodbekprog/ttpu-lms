import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ButtonLink, EmptyState } from "@/components/ui";
import { dayName } from "@/lib/utils";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { PrintButton } from "./print-button";
import { addDays, dayMonth, mondayOfIso, tashkentToday, weekLabel } from "./week";

const DAYS = [1, 2, 3, 4, 5, 6];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_LABELS: Record<string, string> = {
  CHANGED: "O'zgartirilgan",
  MOVED: "Ko'chirilgan",
  CANCELLED: "Bekor",
};

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 8mm; }
  aside, header, nav, .no-print { display: none !important; }
  body { background: #fff !important; }
  main { margin: 0 !important; max-width: none !important; padding: 0 !important; }
  .print-body { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important; }
  .print-table { font-size: 9.5pt; }
  .print-table tr { break-inside: avoid; }
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

      <div className="print-body rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="TTPU"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-full"
            />
            <div>
              <p className="text-lg font-semibold tracking-tight text-brand-950">
                TTPU LMS — Dars jadvali
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {group.name} guruhi · {weekLabel(monday)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Chop etilgan: {tashkentToday()}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="print-table w-full min-w-[900px] border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="w-24 border border-slate-300 bg-slate-100 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Par
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="border border-slate-300 bg-slate-100 px-2 py-1.5 text-left"
                  >
                    <span className="block font-semibold text-slate-800">{dayName(day)}</span>
                    <span className="block text-[10px] font-normal text-slate-500">
                      {dayMonth(addDays(monday, day - 1))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="align-top">
                  <td className="border border-slate-300 px-2 py-1.5">
                    <span className="block font-semibold text-slate-800">{slot}-par</span>
                    <span className="block text-[10px] text-slate-500">{SLOT_TIMES[slot]}</span>
                  </td>
                  {DAYS.map((day) => (
                    <td key={day} className="border border-slate-300 px-2 py-1.5">
                      <div className="space-y-1.5">
                        {entriesAt(day, slot).map((entry) => {
                          const cancelled = entry.status === "CANCELLED";
                          const statusLabel = STATUS_LABELS[entry.status];
                          const parityLabel =
                            entry.parity === "odd"
                              ? "Toq hafta"
                              : entry.parity === "even"
                                ? "Juft hafta"
                                : null;
                          return (
                            <div
                              key={entry.id}
                              className="border-b border-dashed border-slate-200 pb-1.5 last:border-0 last:pb-0"
                            >
                              <p
                                className={
                                  cancelled
                                    ? "font-semibold text-slate-400 line-through"
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
                                  <span className="rounded border border-slate-200 px-1 py-px text-[9px] text-slate-600">
                                    {entry.room}
                                  </span>
                                ) : null}
                                {parityLabel ? (
                                  <span className="rounded border border-amber-300 bg-amber-50 px-1 py-px text-[9px] text-amber-700">
                                    {parityLabel}
                                  </span>
                                ) : null}
                                {statusLabel ? (
                                  <span
                                    className={
                                      cancelled
                                        ? "rounded border border-rose-300 bg-rose-50 px-1 py-px text-[9px] font-semibold text-rose-700"
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
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
