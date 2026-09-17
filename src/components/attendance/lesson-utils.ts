export type CourseOption = { slug: string; title: string };

export const SLOT_TIMES: Record<number, string> = {
  1: "09:00–10:20",
  2: "10:30–11:50",
  3: "12:00–13:20",
  4: "14:20–15:40",
  5: "15:50–17:10",
  6: "17:20–18:40",
  7: "18:50–20:10",
  8: "20:20–21:40",
};

export function normalizeTeacherName(name: string) {
  return name.replace(/\./g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

export function matchCourseSlug(subject: string, courses: CourseOption[]): string | null {
  const subjectTokens = new Set(tokenize(subject));
  if (subjectTokens.size === 0) return null;
  let best: { slug: string; score: number } | null = null;
  for (const course of courses) {
    const score = tokenize(course.title).filter((token) => subjectTokens.has(token)).length;
    if (score > 0 && (best === null || score > best.score)) {
      best = { slug: course.slug, score };
    }
  }
  return best?.slug ?? null;
}

export function todayIso() {
  const date = new Date();
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromIso(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isoForWeekday(day: number, today: number) {
  const date = new Date();
  date.setDate(date.getDate() + (day - today));
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
