import Link from "next/link";
import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { certificateSerial } from "@/components/certificates/certificate-access";
import { PrintButton } from "@/components/certificates/print-button";

const PRINT_STYLES = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  body * { visibility: hidden !important; }
  #ttpu-certificate, #ttpu-certificate * { visibility: visible !important; }
  #ttpu-certificate {
    position: fixed;
    inset: 0;
    padding: 8mm;
    background: #ffffff;
  }
  #ttpu-certificate .cert-card {
    width: 100%;
    height: 100%;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  #ttpu-certificate .cert-card * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
`;

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      course: { select: { title: true } },
      student: { select: { name: true } },
      issuedBy: { select: { name: true } },
    },
  });

  if (!certificate) notFound();

  const isOwner = certificate.studentId === user.id;
  if (!isOwner && !isStaff(user.role)) notFound();

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div className="print:hidden">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href="/certificates"
              className="text-sm text-slate-500 transition hover:text-blue-600"
            >
              ← Sertifikatlar
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {certificate.student.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {certificate.course.title} · {certificateSerial(certificate.id)}
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      <div id="ttpu-certificate" className="mx-auto w-full max-w-5xl">
        <div className="cert-card relative aspect-[297/210] w-full overflow-hidden rounded-2xl border-[10px] border-blue-950 bg-white shadow-xl print:aspect-auto print:h-full print:rounded-none print:border-[6px] print:shadow-none">
          <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
            <span className="font-serif text-[200px] font-bold tracking-widest text-blue-950/5">
              TTPU
            </span>
          </div>

          <div className="relative flex h-full flex-col items-center justify-between border-[3px] border-amber-500/70 px-10 py-6 text-center print:px-8 print:py-5">
            <div className="flex flex-col items-center">
              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-950 text-sm font-bold tracking-wider text-white">
                TTPU
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-500">
                TTPU LMS
              </p>
              <h2 className="mt-1 font-serif text-3xl font-bold text-blue-950">
                Turin Politexnika Universiteti
              </h2>
              <div className="mt-3 h-px w-44 bg-amber-500" />
            </div>

            <div className="flex flex-col items-center">
              <p className="font-serif text-4xl font-bold uppercase tracking-[0.3em] text-blue-950">
                Sertifikat
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">
                Kursni tamomlaganlik sertifikati
              </p>
              <p className="mt-4 text-sm text-slate-500">Ushbu sertifikat</p>
              <p className="mt-1 font-serif text-5xl font-bold leading-tight text-slate-900">
                {certificate.student.name}
              </p>
              <div className="mt-2 h-0.5 w-64 bg-amber-500/60" />
              <p className="mt-3 text-sm text-slate-500">
                quyidagi kursni muvaffaqiyatli tamomlaganligi uchun taqdim etiladi
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold text-blue-900">
                {certificate.course.title}
              </p>
              {certificate.grade != null ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/60 bg-amber-50 px-5 py-1.5 text-sm font-semibold text-amber-700">
                  Natija: {certificate.grade} ball
                </p>
              ) : null}
            </div>

            <div className="grid w-full grid-cols-3 items-end gap-6 text-xs">
              <div className="text-left">
                <p className="font-semibold text-slate-700">Sana</p>
                <p className="mt-1 text-slate-500">{fmtDate(certificate.issuedAt)}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="font-serif text-sm italic text-slate-600">
                  {certificate.issuedBy.name}
                </p>
                <div className="mt-1 h-px w-40 bg-slate-400" />
                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
                  Imzo
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-700">Seriya raqami</p>
                <p className="mt-1 font-mono text-[11px] tracking-wider text-slate-500">
                  {certificateSerial(certificate.id)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
