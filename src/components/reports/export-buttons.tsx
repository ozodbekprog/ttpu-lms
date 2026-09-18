export function ExportButtons({ courseId }: { courseId: string }) {
  const exports = [
    { href: `/api/courses/${courseId}/export/grades`, label: "Baholar CSV" },
    { href: `/api/courses/${courseId}/export/attendance`, label: "Davomat CSV" },
    { href: `/api/courses/${courseId}/export/quizzes`, label: "Test natijalari CSV" },
  ];

  return (
    <div className="flex flex-wrap gap-2.5">
      {exports.map((item) => (
        <a
          key={item.href}
          href={item.href}
          download
          className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-900 hover:shadow-md active:translate-y-0"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors duration-150 group-hover:bg-brand-100">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="m9 15 3 3 3-3" />
            </svg>
          </span>
          {item.label}
        </a>
      ))}
    </div>
  );
}
