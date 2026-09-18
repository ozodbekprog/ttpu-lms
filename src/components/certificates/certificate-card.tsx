import { Badge, ButtonLink, Card, CardBody } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { certificateGrade, certificateSerial } from "@/components/certificates/certificate-access";

type CertificateCardData = {
  id: string;
  grade: number | null;
  issuedAt: Date;
  course: { title: string; coverColor: string };
  issuedBy: { name: string };
};

function MiniSeal() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-11 drop-shadow-sm"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cert-card-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e3c76a" />
          <stop offset="55%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#a9871f" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="url(#cert-card-seal)" />
      <circle cx="24" cy="24" r="16.5" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1" strokeDasharray="2.5 2.5" />
      <path
        d="M16.5 24.5l5 5 10-11"
        fill="none"
        stroke="#131f3c"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CertificateCard({ certificate }: { certificate: CertificateCardData }) {
  const grade = certificateGrade(certificate.grade);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative h-[74px] shrink-0 overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(120px 90px at 12% 130%, ${certificate.course.coverColor}66, transparent 70%)`,
          }}
        />
        <span className="pointer-events-none absolute -right-5 -top-8 select-none font-serif text-[86px] font-bold leading-none text-white/[0.06]">
          TTPU
        </span>
        <span className="absolute left-4 top-3.5">
          <MiniSeal />
        </span>
        <span className="absolute right-3.5 top-3.5">
          <Badge tone={grade.tone} className="ring-1 ring-white/15">
            {grade.label}
          </Badge>
        </span>
        <span className="absolute bottom-2.5 left-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-gold-300/90">
          Sertifikat
        </span>
      </div>

      <CardBody className="flex flex-1 flex-col pt-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-slate-100"
            style={{ backgroundColor: certificate.course.coverColor }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base font-semibold leading-snug text-slate-900">
              {certificate.course.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{fmtDate(certificate.issuedAt)}</p>
          </div>
        </div>

        <dl className="mt-4 space-y-2 rounded-xl bg-slate-50/80 px-3.5 py-3 text-xs ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Seriya</dt>
            <dd className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] tracking-wider text-brand-800 ring-1 ring-slate-200">
              {certificateSerial(certificate.id)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Ball</dt>
            <dd className="font-semibold text-slate-700">
              {certificate.grade ?? "—"}
              <span className="ml-1 text-[11px] font-normal text-slate-400">{grade.label}</span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Bergan</dt>
            <dd className="truncate font-medium text-slate-600">{certificate.issuedBy.name}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Tasdiqlangan hujjat
          </span>
          <ButtonLink
            href={`/certificates/${certificate.id}`}
            size="sm"
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          >
            Ko&apos;rish
          </ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}
