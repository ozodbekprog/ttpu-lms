import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTranscript } from "@/components/transcript/transcript-data";
import { TranscriptDocument } from "@/components/transcript/transcript-document";
import { TranscriptPrintButton } from "@/components/transcript/print-button";
import { Button, Card, CardBody, CardHeader, Label, PageHeader, Select } from "@/components/ui";

const PRINT_STYLES = `
@media print {
  @page { size: A4 portrait; margin: 0; }
  body * { visibility: hidden !important; }
  #ttpu-transcript, #ttpu-transcript * { visibility: visible !important; }
  #ttpu-transcript {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 10mm;
    background: #ffffff;
  }
  #ttpu-transcript .transcript-sheet {
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  #ttpu-transcript .transcript-sheet * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    box-shadow: none !important;
  }
  #ttpu-transcript thead { display: table-header-group; }
  #ttpu-transcript tr { break-inside: avoid; }
}
`;

type StudentOption = { id: string; name: string; group: { name: string } | null };

function groupStudents(students: StudentOption[]) {
  const grouped = new Map<string, StudentOption[]>();
  for (const student of students) {
    const key = student.group?.name ?? "Guruhsiz";
    const list = grouped.get(key);
    if (list) list.push(student);
    else grouped.set(key, [student]);
  }
  return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function StudentPicker({
  students,
  selectedId,
}: {
  students: StudentOption[];
  selectedId?: string;
}) {
  const groups = groupStudents(students);

  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-96">
        <Label>Talaba</Label>
        <Select
          key={selectedId ?? "none"}
          name="studentId"
          defaultValue={selectedId ?? ""}
          required
        >
          <option value="" disabled>
            Talabani tanlang
          </option>
          {groups.map(([groupName, list]) => (
            <optgroup key={groupName} label={`${groupName} · ${list.length} ta`}>
              {list.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary" className="w-full sm:w-auto">
        Ko&apos;rsatish
      </Button>
    </form>
  );
}

export const metadata = { title: "Akademik Transkript — TTPU LMS" };

export default async function TranscriptPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const { studentId } = await searchParams;

  if (!staff && studentId && studentId !== user.id) notFound();

  const targetId = staff && studentId ? studentId : user.id;

  const studentsPromise: Promise<StudentOption[]> = staff
    ? prisma.user.findMany({
        where: { role: "STUDENT", isActive: true },
        select: { id: true, name: true, group: { select: { name: true } } },
        orderBy: { name: "asc" },
        take: 500,
      })
    : Promise.resolve([]);

  const [data, students] = await Promise.all([buildTranscript(targetId), studentsPromise]);

  if (!data) {
    if (!staff) notFound();
    return (
      <>
        <PageHeader
          title="Akademik Transkript"
          subtitle="Talabani tanlang"
          eyebrow="Rasmiy hujjat"
        />
        <Card>
          <CardHeader
            title="Talabani tanlash"
            subtitle={`${students.length} ta faol talaba`}
          />
          <CardBody>
            <StudentPicker students={students} selectedId={studentId} />
            {studentId ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Talaba topilmadi
              </p>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Transkriptni ko&apos;rish uchun talabani tanlang.
              </p>
            )}
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div className="print:hidden">
        <PageHeader
          title="Akademik Transkript"
          subtitle={`${data.student.name}${data.student.group ? ` · ${data.student.group}` : ""}`}
          eyebrow="Rasmiy hujjat"
          action={<TranscriptPrintButton />}
        />

        {staff ? (
          <Card className="mb-6">
            <CardHeader
              title="Talabani tanlash"
              subtitle={`${students.length} ta faol talaba · Hozir: ${data.student.name}`}
            />
            <CardBody>
              <StudentPicker students={students} selectedId={data.student.id} />
            </CardBody>
          </Card>
        ) : null}
      </div>

      <TranscriptDocument data={data} />
    </>
  );
}
