export type WeekParity = "odd" | "even";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseIsoDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function mondayOf(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay() === 0 ? 7 : copy.getDay();
  copy.setDate(copy.getDate() - (weekday - 1));
  return copy;
}

export function resolveWeekStart(value?: string | null): string {
  const parsed = value ? parseIsoDate(value) : null;
  return formatIsoDate(mondayOf(parsed ?? new Date()));
}

export function shiftWeek(weekStartIso: string, weeks: number): string {
  const date = parseIsoDate(weekStartIso) ?? mondayOf(new Date());
  date.setDate(date.getDate() + weeks * 7);
  return formatIsoDate(date);
}

export function isoWeekNumber(weekStartIso: string): number {
  const date = parseIsoDate(weekStartIso) ?? new Date();
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function weekParityOf(weekStartIso: string): WeekParity {
  return isoWeekNumber(weekStartIso) % 2 === 0 ? "even" : "odd";
}

export function formatWeekRange(weekStartIso: string): string {
  const start = parseIsoDate(weekStartIso) ?? mondayOf(new Date());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 5);
  const startMonth = MONTHS_UZ[start.getMonth()];
  const endMonth = MONTHS_UZ[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${startMonth} ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${startMonth} ${start.getFullYear()} – ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
}

export function dayIsoInWeek(weekStartIso: string, dayOfWeek: number): string {
  const start = parseIsoDate(weekStartIso) ?? mondayOf(new Date());
  return formatIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + (dayOfWeek - 1)));
}

export function formatDayShort(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return "";
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
}

export function isoWeekday(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}
