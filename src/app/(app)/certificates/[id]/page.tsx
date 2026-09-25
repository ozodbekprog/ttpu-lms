import Link from "next/link";
import { notFound } from "next/navigation";
import { isStaff, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n";
import {
  certificateSerial,
} from "@/components/certificates/certificate-access";
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
    <svg viewBox="0 0 64 64" className="size-11 text-gold-400 sm:size-14" aria-hidden="true">
      <defs>
        <linearGradient id="cert-detail-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e3c76a" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a9871f" />
        </linearGradient>
      </defs>
      <path
        d="M22 38 18.5 60 32 54.5 45.5 60 42 38"
        fill="url(#cert-detail-seal)"
        stroke="#a9871f"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="26" r="21" fill="url(#cert-detail-seal)" stroke="#a9871f" strokeWidth="0.8" />
      <circle cx="32" cy="26" r="16.5" fill="#ffffff" />
      <circle cx="32" cy="26" r="16.5" fill="none" stroke="#d4af37" strokeWidth="1.2" />
      <circle cx="32" cy="26" r="13" fill="none" stroke="#d4af37" strokeWidth="0.7" strokeDasharray="2.4 2.4" />
      <path
        d="M24.5 26.5l5.4 5.2L40 21.6"
        fill="none"
        stroke="#1d3460"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="32"
        y="42.5"
        textAnchor="middle"
        fontSize="6.4"
        fontWeight="700"
        fill="#a9871f"
        letterSpacing="1.6"
      >
        TTPU
      </text>
    </svg>
  );
}

function CornerOrnaments() {
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-2 size-7 border-l-2 border-t-2 border-gold-400/80" />
      <span className="pointer-events-none absolute right-2 top-2 size-7 border-r-2 border-t-2 border-gold-400/80" />
      <span className="pointer-events-none absolute bottom-2 left-2 size-7 border-b-2 border-l-2 border-gold-400/80" />
      <span className="pointer-events-none absolute bottom-2 right-2 size-7 border-b-2 border-r-2 border-gold-400/80" />
    </>
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
      student: { select: { name: true, group: { select: { name: true } } } },
      issuedBy: { select: { name: true } },
    },
  });

  if (!certificate) notFound();

  const isOwner = certificate.studentId === user.id;
  if (!isOwner && !isStaff(user.role)) notFound();

  const serial = certificateSerial(certificate.id);
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const gradeLabel =
    certificate.grade == null
      ? dict.certGradeNone
      : certificate.grade >= 90
        ? dict.certGradeExcellent
        : certificate.grade >= 70
          ? dict.certGradeGood
          : certificate.grade >= 60
            ? dict.certGradeSatisfactory
            : dict.certGradeUnsatisfactory;

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div className="print:hidden">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors duration-150 hover:text-brand-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              {dict.certListTitle}
            </Link>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-950">
              {certificate.student.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {certificate.course.title} ·{" "}
              <span className="font-mono text-xs tracking-wider text-slate-600">{serial}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PrintButton />
            <p className="text-xs text-slate-600">
              {dict.certPrintHint}
            </p>
          </div>
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
            <CornerOrnaments />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-400/60 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 px-4 py-3 text-white sm:px-8 sm:py-3.5">
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
                  {dict.certOfficial}
                </p>
                <GoldSeal />
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center sm:px-10 sm:py-4 print:px-8 print:py-3">
              <p className="font-serif text-3xl font-bold uppercase tracking-[0.28em] text-brand-950 sm:text-4xl print:text-3xl">
                {dict.certTitle}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-px w-10 bg-gold-400/70" />
                <span className="size-1.5 rotate-45 bg-gold-500" />
                <span className="h-px w-10 bg-gold-400/70" />
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-800">
                {dict.certSubtitle}
              </p>

              <p className="mt-4 text-sm text-slate-500">{dict.certPresented}</p>
              <p className="mt-1 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl print:text-4xl">
                {certificate.student.name}
              </p>
              {certificate.student.group ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                  {dict.certGroupFormat.replace("{group}", certificate.student.group.name)}
                </p>
              ) : null}
              <div className="mt-2.5 h-0.5 w-56 bg-gold-400/70 sm:w-64" />
              <p className="mt-3 text-sm text-slate-500">
                {dict.certCompletion}
              </p>
              <p className="mt-2 font-serif text-xl font-semibold text-brand-800 sm:text-2xl">
                {certificate.course.title}
              </p>
              {certificate.grade != null ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold-400/60 bg-gold-300/15 px-5 py-1.5 text-sm font-semibold text-gold-800">
                  <span className="size-1.5 rotate-45 bg-gold-500" />
                  {dict.certResultFormat
                    .replace("{score}", String(certificate.grade))
                    .replace("{label}", gradeLabel)}
                </p>
              ) : null}
            </div>

            <div className="grid w-full grid-cols-3 items-end gap-4 border-t border-slate-200 px-6 py-4 text-xs sm:gap-6 sm:px-10 print:px-8 print:py-3">
              <div className="text-left">
                <p className="font-semibold text-slate-700">{dict.certDate}</p>
                <p className="mt-1 text-slate-500">{fmtDate(certificate.issuedAt)}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">{dict.certCity}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="font-serif text-base italic text-brand-900">
                  {certificate.issuedBy.name}
                </p>
                <div className="mt-1.5 h-px w-32 bg-gold-400/80 sm:w-40" />
                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-600">
                  {dict.certSignature}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-700">{dict.certSerial}</p>
                <p className="mt-1 font-mono text-[11px] tracking-wider text-slate-500">
                  {serial}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">{dict.certIssuedVia}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
