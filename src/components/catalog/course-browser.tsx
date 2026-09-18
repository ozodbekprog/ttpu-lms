"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardBody, Input } from "@/components/ui";
import { CatalogCourseCard, type CatalogCourse } from "@/components/catalog/catalog-course-card";
import { ElectiveCourseCard } from "@/components/electives/elective-course-card";

type CourseFilter = "all" | "enrolled" | "open";

const FILTERS: { key: CourseFilter; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "enrolled", label: "Yozilganlar" },
  { key: "open", label: "Yozilmaganlar" },
];

export function CourseBrowser({
  items,
  staff,
  variant,
  search,
  searchable = false,
  empty,
}: {
  items: CatalogCourse[];
  staff: boolean;
  variant: "catalog" | "elective";
  search?: ReactNode;
  searchable?: boolean;
  empty?: ReactNode;
}) {
  const [filter, setFilter] = useState<CourseFilter>("all");
  const [term, setTerm] = useState("");

  const counts = useMemo(
    () => ({
      all: items.length,
      enrolled: items.filter((course) => course.isEnrolled).length,
      open: items.filter((course) => !course.isEnrolled).length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return items.filter((course) => {
      if (filter === "enrolled" && !course.isEnrolled) return false;
      if (filter === "open" && course.isEnrolled) return false;
      if (!needle) return true;
      return (
        course.title.toLowerCase().includes(needle) ||
        course.teacherName.toLowerCase().includes(needle)
      );
    });
  }, [items, filter, term]);

  function reset() {
    setFilter("all");
    setTerm("");
  }

  return (
    <>
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-3">
          {search ? (
            search
          ) : searchable ? (
            <div className="relative w-full sm:w-96">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Kurs yoki o'qituvchi nomi bo'yicha qidirish"
                aria-label="Tanlov fanlarni qidirish"
                className="pl-9"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!staff && items.length > 0
              ? FILTERS.map((item) => {
                  const active = filter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(item.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                        active
                          ? "bg-brand-900 text-white shadow-sm"
                          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] font-bold",
                          active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {counts[item.key]}
                      </span>
                    </button>
                  );
                })
              : null}
            <span className="ml-auto text-xs font-medium text-slate-500">
              {visible.length} ta kurs
            </span>
          </div>
        </CardBody>
      </Card>

      {items.length === 0 && empty ? (
        empty
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
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
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <p className="font-medium text-slate-800">Bu filtr bo&apos;yicha kurs topilmadi</p>
          <p className="max-w-md text-sm text-slate-500">
            Boshqa filtrni tanlang yoki qidiruvni tozalab ko&apos;ring.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50"
          >
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((course, index) => (
            <div
              key={course.id}
              className="h-full animate-fade-up"
              style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
            >
              {variant === "elective" ? (
                <ElectiveCourseCard course={course} staff={staff} />
              ) : (
                <CatalogCourseCard course={course} staff={staff} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
