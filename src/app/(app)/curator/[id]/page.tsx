import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { buildGroupDetail, getCuratorGroups } from "@/app/api/curator/data";
import { ButtonLink, Card, CardBody, CardHeader, PageHeader, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CuratorStudentsTable } from "@/components/curator/students-table";
import { ReportSendButton } from "@/components/curator/report-send";

export default async function CuratorGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const { id } = await params;

  const allowed = await getCuratorGroups(user, id);
  if (allowed.length === 0) notFound();

  const group = await buildGroupDetail(id);
  if (!group) notFound();

  const problematic = group.students.filter((student) => student.problematic);

  return (
    <>
      <PageHeader
        title={group.name}
        eyebrow="Kurator paneli"
        subtitle={`${group.studentCount} ta talaba${group.curator ? ` · Kurator: ${group.curator.name}` : ""}`}
        action={
          <ButtonLink href="/curator" variant="secondary" size="sm">
            Guruhlarga qaytish
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Talabalar"
          value={group.studentCount}
          hint={group.year ? `${group.year}-yil` : "Guruh talabalari"}
        />
        <Stat
          label="O'rtacha davomat"
          value={group.averageAttendance !== null ? `${group.averageAttendance}%` : "—"}
          hint="80% — imtihonga ruxsat"
        />
        <Stat
          label="Ruxsatsiz"
          value={group.lowAttendanceCount}
          hint="Davomat 80% dan past talabalar"
        />
        <Stat
          label="O'rtacha GPA"
          value={group.averageGpa !== null ? group.averageGpa.toFixed(2) : "—"}
          hint="4.0 baholash tizimi"
        />
      </div>

      {problematic.length > 0 ? (
        <Card className="mt-6 border-amber-200/70">
          <CardHeader
            title={`Muammoli talabalar: ${problematic.length} ta`}
            subtitle="Davomat 80% dan past yoki GPA 2.0 dan past"
          />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {problematic.map((student) => (
                <span
                  key={student.id}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
                    student.attendance.eligible
                      ? "bg-amber-50 text-amber-700 ring-amber-200/70"
                      : "bg-rose-50 text-rose-700 ring-rose-200/70",
                  )}
                >
                  <span className="font-semibold">{student.name}</span>
                  <span>davomat {student.attendance.percent}%</span>
                  <span>
                    GPA {student.gpa !== null ? student.gpa.toFixed(2) : "—"}
                  </span>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Talabalar jadvali" subtitle={`${group.studentCount} ta talaba`} />
        <CardBody>
          <CuratorStudentsTable students={group.students} />
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Haftalik hisobot"
          subtitle="Davomat xulosasi va muammoli talabalar ro'yxati kuratorga yuboriladi"
          action={<ReportSendButton groupId={group.id} />}
        />
      </Card>
    </>
  );
}
