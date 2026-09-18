export const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isoFromDate(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function tashkentToday() {
  return isoFromDate(new Date(Date.now() + TASHKENT_OFFSET_MS));
}

export function addDays(iso: string, days: number) {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromDate(date);
}

export function mondayOfIso(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) return mondayOfIso(tashkentToday());
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (weekday - 1));
  return isoFromDate(date);
}

export function isoWeekNumber(iso: string) {
  const parsed = parseIsoDate(iso);
  if (!parsed) return 1;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function dayMonth(iso: string) {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

export function weekLabel(monday: string) {
  const end = addDays(monday, 5);
  return `${dayMonth(monday)} – ${dayMonth(end)}.${end.slice(0, 4)}`;
}
