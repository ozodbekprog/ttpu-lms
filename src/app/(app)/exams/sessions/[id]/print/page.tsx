import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import {
  canManageSession,
  getSessionSheetRows,
  sessionTypeLabel,
} from "@/components/exams/session-data";
import { PrintButton } from "@/components/exams/print-button";
import { ButtonLink } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

const PRINT_STYLES = `@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0; }
  @page { size: A4 portrait; margin: 14mm; }
}`;

export default async function SessionPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!isStaff(user.role)) notFound();

  const { id } = await params;
  const data = await getSessionSheetRows(id);
  if (!data) notFound();
  if (!canManageSession({ id: user.id, role: user.role }, data.session.course.teacherId)) notFound();

  const session = data.session;
  const admitted = data.rows.filter((row) => row.admitted);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <ButtonLink href={`/exams/sessions/${session.id}`} variant="secondary" size="sm">
          Orqaga
        </ButtonLink>
        <PrintButton />
      </div>
      <div className="print-area mx-auto max-w-3xl bg-white p-8 text-slate-900">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
            Turin Politexnika Universiteti
          </p>
          <h1 className="mt-2 text-lg font-bold">Imtihonga ruxsat ro&apos;yxati</h1>
          <p className="mt-1 text-sm text-slate-600">
            {session.title} · {sessionTypeLabel(session.type)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="font-semibold">Kurs:</span> {session.course.title}
          </p>
          <p>
            <span className="font-semibold">Sana:</span> {fmtDate(session.date)}
          </p>
          <p>
            <span className="font-semibold">Vaqt:</span>{" "}
            {session.startTime ? `${session.startTime}${session.endTime ? `–${session.endTime}` : ""}` : "—"}
          </p>
          <p>
            <span className="font-semibold">Xona:</span> {session.room ?? "—"}
          </p>
          <p>
            <span className="font-semibold">O&apos;qituvchi:</span> {session.course.teacher.name}
          </p>
          <p>
            <span className="font-semibold">Ro&apos;yxatda:</span> {admitted.length} ta talaba
          </p>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">#</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">F.I.Sh.</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Guruh</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">O&apos;rindiq</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Davomat</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Ruxsat</th>
            </tr>
          </thead>
          <tbody>
            {admitted.map((row, index) => (
              <tr key={row.studentId}>
                <td className="border border-slate-300 px-3 py-2">{index + 1}</td>
                <td className="border border-slate-300 px-3 py-2">{row.studentName}</td>
                <td className="border border-slate-300 px-3 py-2">{row.studentGroup ?? "—"}</td>
                <td className="border border-slate-300 px-3 py-2">{row.seat ?? "—"}</td>
                <td className="border border-slate-300 px-3 py-2">{row.attendance.percent}%</td>
                <td className="border border-slate-300 px-3 py-2">
                  {row.attendance.eligible ? "Ruxsat" : "Majburiy"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admitted.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            Ro&apos;yxat hali shakllantirilmagan.
          </p>
        ) : null}

        <div className="mt-10 flex justify-between text-sm">
          <p>Imtihon komissiyasi raisi: _______________</p>
          <p>Imzo: _______________</p>
        </div>
      </div>
    </>
  );
}
