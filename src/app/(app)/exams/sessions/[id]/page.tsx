import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import {
  canManageSession,
  EXAM_MIN_PERCENT,
  getSessionById,
  getSessionSheetRows,
  getStudentSessionView,
  sessionTypeLabel,
} from "@/components/exams/session-data";
import { SessionStatusActions, SheetManager } from "@/components/exams/session-admin";
import {
  AttendanceBanner,
  SheetStatusBadge,
  SessionStateBadge,
  SessionTypeBadge,
} from "@/components/exams/session-badges";
import { ButtonLink, Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function sessionTime(startTime: string | null, endTime: string | null) {
  if (!startTime) return "Belgilanmagan";
  return endTime ? `${startTime}–${endTime}` : startTime;
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  if (isStaff(user.role)) {
    const session = await getSessionById(id);
    if (!session) notFound();
    if (!canManageSession({ id: user.id, role: user.role }, session.course.teacherId)) notFound();

    const data = await getSessionSheetRows(id);
    if (!data) notFound();
    const rows = data.rows;
    const admitted = rows.filter((row) => row.admitted).length;
    const eligible = rows.filter((row) => row.attendance.eligible).length;
    const passed = rows.filter((row) => row.status === "PASSED").length;
    const failed = rows.filter((row) => row.status === "FAILED").length;
    const absent = rows.filter((row) => row.status === "ABSENT").length;

    return (
      <>
        <PageHeader
          title={session.title}
          eyebrow={session.course.title}
          subtitle={`${sessionTypeLabel(session.type)} · ${fmtDate(session.date)}`}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ButtonLink href={`/exams/sessions/${session.id}/print`} variant="secondary" size="sm">
                Ruxsat ro&apos;yxati (print)
              </ButtonLink>
              <SessionStatusActions sessionId={session.id} admissionOpen={session.admissionOpen} />
            </div>
          }
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Ro'yxatda" value={admitted} hint={`${rows.length} ta talabadan`} />
          <Stat label="Ruxsatli" value={eligible} hint={`Kamida ${EXAM_MIN_PERCENT}% davomat`} />
          <Stat label="O'tdi" value={passed} hint={`${failed} ta o'tmadi`} />
          <Stat label="Kelmagan" value={absent} hint={`${rows.length - admitted} ta ro'yxatsiz`} />
        </div>
        <Card className="mb-6">
          <CardHeader
            title="Sessiya ma'lumotlari"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <SessionTypeBadge type={session.type} />
                <SessionStateBadge date={session.date} />
                <span className="text-xs text-slate-500">
                  {session.admissionOpen ? "Ruxsat ochiq" : "Ruxsat yopiq"}
                </span>
              </div>
            }
          />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoTile label="Sana" value={fmtDate(session.date)} />
              <InfoTile label="Vaqt" value={sessionTime(session.startTime, session.endTime)} />
              <InfoTile label="Xona" value={session.room ?? "—"} />
              <InfoTile label="Semestr" value={session.term?.name ?? "Semestrsiz"} />
            </div>
          </CardBody>
        </Card>
        <SheetManager sessionId={session.id} rows={rows} />
      </>
    );
  }

  const view = await getStudentSessionView(id, user.id);
  if (!view) notFound();
  const { session, sheet, attendance } = view;

  return (
    <>
      <PageHeader
        title={session.title}
        eyebrow={session.course.title}
        subtitle={`${sessionTypeLabel(session.type)} · ${fmtDate(session.date)}`}
        action={<SessionStateBadge date={session.date} />}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Imtihon ma'lumotlari"
            action={<SessionTypeBadge type={session.type} />}
          />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Sana" value={fmtDate(session.date)} />
              <InfoTile label="Vaqt" value={sessionTime(session.startTime, session.endTime)} />
              <InfoTile label="Xona" value={session.room ?? "—"} />
              <InfoTile label="Semestr" value={session.term?.name ?? "Semestrsiz"} />
              <InfoTile label="O'rindiq" value={sheet?.seat ?? "—"} />
              <InfoTile label="Ruxsat oynasi" value={session.admissionOpen ? "Ochiq" : "Yopiq"} />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              O&apos;qituvchi: {session.course.teacher.name}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Mening holatim"
            action={sheet ? <SheetStatusBadge status={sheet.status} score={sheet.score} /> : null}
          />
          <CardBody>
            <AttendanceBanner attendance={attendance} compact />
            {sheet ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoTile label="O'rindiq" value={sheet.seat ?? "—"} />
                <InfoTile
                  label="Natija"
                  value={
                    sheet.score != null
                      ? `${sheet.status} · ${sheet.score} ball`
                      : sheet.status
                  }
                />
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                Siz hali imtihon ro&apos;yxatiga kiritilmagansiz. O&apos;qituvchingizga murojaat qiling.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
