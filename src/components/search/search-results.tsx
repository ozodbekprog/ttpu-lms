import Link from "next/link";
import type { ReactNode } from "react";
import type { MaterialType, Role } from "@prisma/client";
import { Avatar, Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import type { SearchResults } from "./search-data";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "Talaba",
};

const ROLE_TONES: Record<Role, string> = {
  ADMIN: "rose",
  TEACHER: "blue",
  STUDENT: "slate",
};

const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  TEXT: "Matn",
  FILE: "Fayl",
  VIDEO: "Video",
  LINK: "Havola",
};

const COURSE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const MATERIAL_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const ASSIGNMENT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const QUIZ_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const CHEVRON_ICON = (
  <svg className="shrink-0 text-slate-300 transition-colors group-hover:text-brand-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

function plainText(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/[#*`>_\[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 110) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", className)}>
      {children}
    </span>
  );
}

function ResultRow({
  href,
  icon,
  title,
  subtitle,
  badge,
  meta,
  avatar,
}: {
  href: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string | null;
  badge?: ReactNode;
  meta?: string | null;
  avatar?: ReactNode;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-slate-50">
      {avatar ?? icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-slate-800 transition-colors group-hover:text-brand-800">
          {title}
        </span>
        {subtitle ? <span className="mt-0.5 block truncate text-sm text-slate-500">{subtitle}</span> : null}
      </span>
      {badge}
      {meta ? <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{meta}</span> : null}
      {CHEVRON_ICON}
    </Link>
  );
}

function SectionCard({
  title,
  count,
  delay,
  children,
}: {
  title: string;
  count: number;
  delay: number;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card>
        <CardHeader title={title} action={<Badge tone="blue">{count}</Badge>} />
        <div className="divide-y divide-slate-100">{children}</div>
      </Card>
    </div>
  );
}

export function SearchResultsView({ query, data }: { query: string; data: SearchResults }) {
  const total =
    data.courses.length +
    data.materials.length +
    data.assignments.length +
    data.quizzes.length +
    data.users.length;

  if (total === 0) {
    return (
      <EmptyState
        title="Hech narsa topilmadi"
        description={`"${query}" bo'yicha natija topilmadi. Boshqa kalit so'z bilan urinib ko'ring.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">{total}</span> ta natija topildi
      </p>

      {data.courses.length > 0 ? (
        <SectionCard title="Kurslar" count={data.courses.length} delay={0}>
          {data.courses.map((course) => (
            <ResultRow
              key={course.id}
              href={`/courses/${course.slug}`}
              icon={<IconTile className="bg-brand-50 text-brand-700">{COURSE_ICON}</IconTile>}
              title={course.title}
              subtitle={course.description ? truncate(plainText(course.description)) : "Kurs"}
            />
          ))}
        </SectionCard>
      ) : null}

      {data.materials.length > 0 ? (
        <SectionCard title="Materiallar" count={data.materials.length} delay={60}>
          {data.materials.map((material) => (
            <ResultRow
              key={material.id}
              href={`/courses/${material.course.slug}`}
              icon={<IconTile className="bg-amber-50 text-amber-700">{MATERIAL_ICON}</IconTile>}
              title={material.title}
              subtitle={material.content ? `${material.course.title} · ${truncate(plainText(material.content))}` : material.course.title}
              badge={<Badge tone="amber">{MATERIAL_TYPE_LABELS[material.type]}</Badge>}
            />
          ))}
        </SectionCard>
      ) : null}

      {data.assignments.length > 0 ? (
        <SectionCard title="Topshiriqlar" count={data.assignments.length} delay={120}>
          {data.assignments.map((assignment) => (
            <ResultRow
              key={assignment.id}
              href={`/courses/${assignment.course.slug}/assignments/${assignment.id}`}
              icon={<IconTile className="bg-emerald-50 text-emerald-700">{ASSIGNMENT_ICON}</IconTile>}
              title={assignment.title}
              subtitle={assignment.course.title}
              meta={assignment.dueAt ? `Muddat: ${fmtDate(assignment.dueAt)}` : null}
            />
          ))}
        </SectionCard>
      ) : null}

      {data.quizzes.length > 0 ? (
        <SectionCard title="Testlar" count={data.quizzes.length} delay={180}>
          {data.quizzes.map((quiz) => (
            <ResultRow
              key={quiz.id}
              href={`/quizzes/${quiz.id}`}
              icon={<IconTile className="bg-purple-50 text-purple-700">{QUIZ_ICON}</IconTile>}
              title={quiz.title}
              subtitle={quiz.course.title}
              meta={quiz.dueAt ? `Muddat: ${fmtDate(quiz.dueAt)}` : null}
            />
          ))}
        </SectionCard>
      ) : null}

      {data.users.length > 0 ? (
        <SectionCard title="Foydalanuvchilar" count={data.users.length} delay={240}>
          {data.users.map((person) => (
            <ResultRow
              key={person.id}
              href={`/users/${person.id}`}
              avatar={<Avatar name={person.name} src={person.avatarUrl} />}
              title={person.name}
              subtitle={person.email}
              badge={<Badge tone={ROLE_TONES[person.role]}>{ROLE_LABELS[person.role]}</Badge>}
            />
          ))}
        </SectionCard>
      ) : null}
    </div>
  );
}
