import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Table,
} from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { certificateSerial } from "@/components/certificates/certificate-access";
import { CertificateDeleteButton } from "@/components/certificates/certificate-delete-button";
import { IssueCertificateForm } from "@/components/certificates/issue-certificate-form";

function SealIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14.2-1.4 6.3L12 18l4.9 2.5-1.4-6.3" />
    </svg>
  );
}

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
          title="Sertifikatlarim"
          subtitle={`${certificates.length} ta sertifikat`}
        />
        {certificates.length === 0 ? (
          <EmptyState
            title="Sertifikatlar yo'q"
            description="Kurslarni muvaffaqiyatli tamomlaganingizdan so'ng sertifikatlar shu yerda paydo bo'ladi."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <Card
                key={certificate.id}
                className="flex h-full flex-col overflow-hidden transition-shadow duration-150 hover:shadow-lift"
              >
                <div className="h-1.5" style={{ backgroundColor: certificate.course.coverColor }} />
                <CardBody className="flex flex-1 flex-col">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-300/20 text-gold-600">
                      <SealIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-900">
                        {certificate.course.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Berilgan: {fmtDate(certificate.issuedAt)}
                      </p>
                    </div>
                    <Badge tone="green">Sertifikat</Badge>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Seriya</dt>
                      <dd className="font-mono text-[11px] tracking-wider text-slate-600">
                        {certificateSerial(certificate.id)}
                      </dd>
                    </div>
                    {certificate.grade != null ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-400">Ball</dt>
                        <dd className="font-semibold text-brand-800">{certificate.grade}</dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Bergan</dt>
                      <dd className="truncate text-slate-600">{certificate.issuedBy.name}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex justify-end pt-5">
                    <ButtonLink href={`/certificates/${certificate.id}`} size="sm">
                      Ko&apos;rish
                    </ButtonLink>
                  </div>
                </CardBody>
              </Card>
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
        <PageHeader title="Sertifikatlar" subtitle="O'qituvchi paneli" />
        <EmptyState title="Kurslar yo'q" description="Avval kurs yarating." />
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

  return (
    <>
      <PageHeader
        title="Sertifikatlar"
        subtitle={`${certificates.length} ta berilgan · ${selected.title}`}
        action={
          <form method="get" className="flex items-end gap-2">
            <Select name="courseId" defaultValue={selected.id} className="w-56 sm:w-64">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <IssueCertificateForm
          courseId={selected.id}
          students={students}
          issuedStudentIds={issuedStudentIds}
        />

        <Card>
          <CardHeader
            title="Berilgan sertifikatlar"
            subtitle={`${certificates.length} ta`}
          />
          <CardBody>
            {certificates.length === 0 ? (
              <EmptyState
                title="Hali sertifikat berilmagan"
                description="Chap tarafdagi shakl orqali talabaga sertifikat bering."
              />
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2.5 pr-3 text-left font-medium">Talaba</th>
                    <th className="px-3 py-2.5 text-left font-medium">Sana</th>
                    <th className="px-3 py-2.5 text-left font-medium">Ball</th>
                    <th className="px-3 py-2.5 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((certificate) => (
                    <tr
                      key={certificate.id}
                      className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="py-3 pr-3">
                        <p className="text-sm font-medium text-slate-800">
                          {certificate.student.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] tracking-wider text-slate-400">
                          {certificate.student.group?.name ?? "—"} ·{" "}
                          {certificateSerial(certificate.id)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {fmtDate(certificate.issuedAt)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-slate-700">
                        {certificate.grade ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-end gap-1.5">
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
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
