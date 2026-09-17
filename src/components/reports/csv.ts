import "server-only";

export type CsvValue = string | number | null | undefined;

export function csvCell(value: CsvValue) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function csvResponse(filename: string, rows: CsvValue[][]) {
  const body = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "no-store",
    },
  });
}
