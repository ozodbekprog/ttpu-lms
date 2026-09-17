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

function GoldSeal() {
  return (
    <svg viewBox="0 0 56 56" className="size-10 text-gold-400 sm:size-12" aria-hidden="true">
      <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="28"
        cy="28"
        r="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="2.5 3"
      />
      <path
        d="M20 28.5l5.2 5.2L36.5 22.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 2.5v4M28 49.5v4M2.5 28h4M49.5 28h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <text
        x="28"
        y="44"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="600"
        fill="currentColor"
        letterSpacing="1.5"
      >
        TTPU
      </text>
    </svg>
  );
}

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
              className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors duration-150 hover:text-brand-700"
            >
              ← Sertifikatlar
            </Link>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-950">
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
        <div className="cert-card relative w-full overflow-hidden rounded-2xl border-[10px] border-brand-950 bg-white shadow-xl md:aspect-[297/210] print:aspect-auto print:h-full print:rounded-none print:border-[6px] print:shadow-none">
          <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
            <span className="font-serif text-[120px] font-bold tracking-widest text-brand-950/[0.04] sm:text-[220px]">
              TTPU
            </span>
          </div>

          <div className="relative flex h-full flex-col border-[3px] border-gold-400/70 print:border-[2px]">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-950 px-4 py-3 text-white sm:px-8 sm:py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border border-gold-400/50 bg-white/5 text-[11px] font-bold tracking-wider text-white sm:size-11">
                  TTPU
                </span>
                <div>
                  <p className="font-serif text-base font-semibold leading-tight sm:text-lg">
                    Turin Politexnika Universiteti
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-300">
                    TTPU LMS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.35em] text-white/60 sm:block">
                  Sertifikat
                </p>
                <GoldSeal />
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center sm:px-10 sm:py-4 print:px-8 print:py-3">
              <p className="font-serif text-3xl font-bold uppercase tracking-[0.28em] text-brand-950 sm:text-4xl print:text-3xl">
                Sertifikat
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-600">
                Kursni tamomlaganlik sertifikati
              </p>
              <p className="mt-4 text-sm text-slate-500">Ushbu sertifikat</p>
              <p className="mt-1 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl print:text-4xl">
                {certificate.student.name}
              </p>
              <div className="mt-2.5 h-0.5 w-56 bg-gold-400/70 sm:w-64" />
              <p className="mt-3 text-sm text-slate-500">
                quyidagi kursni muvaffaqiyatli tamomlaganligi uchun taqdim etiladi
              </p>
              <p className="mt-2 font-serif text-xl font-semibold text-brand-800 sm:text-2xl">
                {certificate.course.title}
              </p>
              {certificate.grade != null ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold-400/60 bg-gold-300/15 px-5 py-1.5 text-sm font-semibold text-gold-600">
                  Natija: {certificate.grade} ball
                </p>
              ) : null}
            </div>

            <div className="grid w-full grid-cols-3 items-end gap-4 border-t border-slate-200 px-6 py-4 text-xs sm:gap-6 sm:px-10 print:px-8 print:py-3">
              <div className="text-left">
                <p className="font-semibold text-slate-700">Sana</p>
                <p className="mt-1 text-slate-500">{fmtDate(certificate.issuedAt)}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="font-serif text-sm italic text-slate-600">
                  {certificate.issuedBy.name}
                </p>
                <div className="mt-1.5 h-px w-32 bg-slate-400 sm:w-40" />
                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">Imzo</p>
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
