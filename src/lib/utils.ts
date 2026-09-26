export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const DAYS_UZ = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const MONTHS_UZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

export function dayName(dayOfWeek: number) {
  return DAYS_UZ[dayOfWeek % 7];
}

export function fmtDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}, ${d.getFullYear()}`;
}

export function fmtDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${fmtDate(d)} ${hh}:${mm}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function gradeColor(score: number | null | undefined, max = 100) {
  if (score == null) return "text-slate-600";
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-amber-600";
  return "text-rose-600";
}

export function scorePercent(score: number | null | undefined, max = 100) {
  if (score == null) return null;
  return Math.round((score / max) * 100);
}
