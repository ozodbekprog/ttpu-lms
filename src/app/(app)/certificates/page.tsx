import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Select,
  Stat,
  Table,
} from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import {
  certificateGrade,
  certificateSerial,
} from "@/components/certificates/certificate-access";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { CertificateDeleteButton } from "@/components/certificates/certificate-delete-button";
import { CertificateEmptyState } from "@/components/certificates/certificate-empty-state";
import { IssueCertificateForm } from "@/components/certificates/issue-certificate-form";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: user.id },
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { id: true, title: true, coverColor: true } },
        issuedBy: { select: { name: true } },
      },
    });

    return (
      <>
        <PageHeader
          eyebrow="TTPU LMS"
          title="Sertifikatlarim"
          subtitle={`${certificates.length} ta sertifikat`}
        />
        {certificates.length === 0 ? (
          <CertificateEmptyState
            title="Sertifikatlar yo'q"
            description="Kurslarni muvaffaqiyatli tamomlaganingizdan so'ng sertifikatlar shu yerda paydo bo'ladi."
            action={
              <ButtonLink href="/courses" variant="secondary">
                Kurslarga o&apos;tish
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        )}
      </>
    );
  }

  const courses = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    orderBy: { title: "asc" },
  });

  const { courseId } = await searchParams;
  const selected = courses.find((course) => course.id === courseId) ?? courses[0] ?? null;

  if (!selected) {
    return (
      <>
        <PageHeader eyebrow="TTPU LMS" title="Sertifikatlar" subtitle="O'qituvchi paneli" />
        <CertificateEmptyState
          title="Kurslar yo'q"
          description="Sertifikat berish uchun avval kurs yaratib, talabalarni unga yozing."
          action={<ButtonLink href="/courses">Kurslar bo&apos;limiga</ButtonLink>}
        />
      </>
    );
  }

  const [enrollments, certificates] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: selected.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.certificate.findMany({
      where: { courseId: selected.id },
      orderBy: { issuedAt: "desc" },
      include: {
        student: { select: { id: true, name: true, group: { select: { name: true } } } },
        issuedBy: { select: { name: true } },
      },
    }),
  ]);

  const students = enrollments.map((enrollment) => ({
    id: enrollment.user.id,
    name: enrollment.user.name,
  }));
  const issuedStudentIds = certificates.map((certificate) => certificate.studentId);
  const pendingCount = students.filter((student) => !issuedStudentIds.includes(student.id)).length;
  const graded = certificates
    .map((certificate) => certificate.grade)
    .filter((grade): grade is number => grade != null);
  const averageGrade = graded.length
    ? Math.round(graded.reduce((sum, grade) => sum + grade, 0) / graded.length)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="TTPU LMS"
        title="Sertifikatlar"
        subtitle={selected.title}
        action={
          <form method="get" className="flex items-center gap-2">
            <Select name="courseId" defaultValue={selected.id} className="w-52 sm:w-64">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Ko&apos;rsatish
            </Button>
          </form>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Berilgan" value={certificates.length} hint="Joriy kurs bo'yicha" />
        <Stat label="Kutayotgan talaba" value={pendingCount} hint="Sertifikat berilmagan" />
        <Stat
          label="O'rtacha ball"
          value={averageGrade ?? "—"}
          hint={graded.length ? `${graded.length} ta baholangan` : "Baholar kiritilmagan"}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <IssueCertificateForm
          courseId={selected.id}
          courseTitle={selected.title}
          students={students}
          issuedStudentIds={issuedStudentIds}
        />

        <Card>
          <CardHeader
            title="Berilgan sertifikatlar"
            subtitle={`${certificates.length} ta`}
            action={<Badge tone="green">Faol</Badge>}
          />
          <CardBody>
            {certificates.length === 0 ? (
              <CertificateEmptyState
                title="Hali sertifikat berilmagan"
                description="Chap tarafdagi shakl orqali talabaga sertifikat bering."
              />
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2.5 pr-3 text-left font-medium">Talaba</th>
                    <th className="px-3 py-2.5 text-left font-medium">Sana</th>
                    <th className="px-3 py-2.5 text-left font-medium">Natija</th>
                    <th className="px-3 py-2.5 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((certificate) => {
                    const grade = certificateGrade(certificate.grade);
                    return (
                      <tr
                        key={certificate.id}
                        className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={certificate.student.name} size={36} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {certificate.student.name}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-[11px] tracking-wider text-slate-400">
                                {certificate.student.group?.name ?? "—"} ·{" "}
                                {certificateSerial(certificate.id)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">
                          {fmtDate(certificate.issuedAt)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={grade.tone}>
                            {certificate.grade != null ? `${certificate.grade} ball` : grade.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <ButtonLink
                              href={`/certificates/${certificate.id}`}
                              variant="secondary"
                              size="sm"
                            >
                              Ko&apos;rish
                            </ButtonLink>
                            <CertificateDeleteButton
                              certificateId={certificate.id}
                              studentName={certificate.student.name}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
