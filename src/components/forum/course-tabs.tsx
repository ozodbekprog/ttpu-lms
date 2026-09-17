import Link from "next/link";
import { cn } from "@/lib/utils";

export type CourseTabKey =
  | "materials"
  | "assignments"
  | "attendance"
  | "announcements"
  | "forum"
  | "students";

export function CourseTabs({
  slug,
  active,
  canManage,
}: {
  slug: string;
  active: CourseTabKey;
  canManage: boolean;
}) {
  const tabs: Array<{ id: CourseTabKey; href: string; label: string }> = [
    { id: "materials", href: `/courses/${slug}`, label: "Materiallar" },
    { id: "assignments", href: `/courses/${slug}/assignments`, label: "Topshiriqlar" },
    { id: "attendance", href: `/courses/${slug}/attendance`, label: "Davomat" },
    { id: "announcements", href: `/courses/${slug}/announcements`, label: "E'lonlar" },
    { id: "forum", href: `/courses/${slug}/forum`, label: "Forum" },
    ...(canManage
      ? [{ id: "students" as const, href: `/courses/${slug}?tab=students`, label: "Talabalar" }]
      : []),
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition",
            tab.id === active
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
