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
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
