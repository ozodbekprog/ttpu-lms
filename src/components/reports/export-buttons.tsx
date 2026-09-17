export function ExportButtons({ courseId }: { courseId: string }) {
  const exports = [
    { href: `/api/courses/${courseId}/export/grades`, label: "Baholar CSV" },
    { href: `/api/courses/${courseId}/export/attendance`, label: "Davomat CSV" },
    { href: `/api/courses/${courseId}/export/quizzes`, label: "Test natijalari CSV" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {exports.map((item) => (
        <a
          key={item.href}
          href={item.href}
          download
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-600"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          {item.label}
        </a>
      ))}
    </div>
  );
}
