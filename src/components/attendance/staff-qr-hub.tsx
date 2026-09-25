import Link from "next/link";
import { Badge, ButtonLink, Card, CardBody, EmptyState } from "@/components/ui";

export type StaffQrHubCourse = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  students: number;
};

const STEPS = [
  {
    title: "Sessiya boshlang",
    description: "Kurs kartasidagi tugma orqali yangi QR sessiya oching.",
  },
  {
    title: "QR kodni ko'rsating",
    description: "Ekrandagi kodni proyektorga chiqaring yoki talabalarga ko'rsating.",
  },
  {
    title: "Talabalar skanerlaydi",
    description: "Talabalar QR kod yoki 6 belgili kod orqali davomatni belgilaydi.",
  },
];

export function StaffQrHub({ courses }: { courses: StaffQrHubCourse[] }) {
  if (courses.length === 0) {
    return (
      <EmptyState
        title="Kurslar yo'q"
        description="QR sessiya boshlash uchun sizga biriktirilgan kurslar mavjud emas."
        action={
          <ButtonLink href="/courses" variant="secondary" size="sm">
            Kurslarga o&apos;tish
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <Card className="animate-fade-up">
        <CardBody className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="animate-fade-up group relative overflow-hidden transition-shadow duration-200 hover:shadow-lift"
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
            <CardBody className="flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-200 group-hover:bg-brand-100">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 20h3v-3" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="block truncate font-semibold tracking-tight text-slate-900 transition-colors duration-150 hover:text-brand-700"
                    >
                      {course.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">{course.students} ta talaba</p>
                  </div>
                </div>
                {course.isPublished ? null : <Badge tone="amber">Qoralama</Badge>}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <ButtonLink href={`/courses/${course.slug}/attendance`} size="sm">
                  QR sessiya ochish
                </ButtonLink>
                <ButtonLink
                  href={`/courses/${course.slug}/attendance/journal`}
                  variant="secondary"
                  size="sm"
                >
                  Jurnal
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
