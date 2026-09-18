import type { BuilderCourse, BuilderLessonType, BuilderSubject, Dictionaries } from "./types";

export const FALLBACK_LESSON_TYPES = ["Ma'ruza", "Amaliy", "Seminar", "Laboratoriya"];

export function fallbackSubjects(courses: BuilderCourse[]): BuilderSubject[] {
  return courses.map((course) => ({ id: null, name: course.title, color: course.coverColor }));
}

export function fallbackLessonTypes(): BuilderLessonType[] {
  return FALLBACK_LESSON_TYPES.map((name) => ({ id: null, name, color: null }));
}

export function findCourseForSubject(subject: BuilderSubject, courses: BuilderCourse[]): BuilderCourse | null {
  if (subject.id) {
    const bySubject = courses.find((course) => course.subjectId === subject.id);
    if (bySubject) return bySubject;
  }
  const target = subject.name.trim().toLowerCase();
  return courses.find((course) => course.title.trim().toLowerCase() === target) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function readColor(record: Record<string, unknown>): string | null {
  const value = readText(record, ["color", "colour", "hex"]);
  if (!value) return null;
  return /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : null;
}

function parseSubjects(value: unknown): BuilderSubject[] {
  if (!Array.isArray(value)) return [];
  const items: BuilderSubject[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim().length > 0) {
      items.push({ id: null, name: item.trim(), color: null });
      continue;
    }
    if (!isRecord(item)) continue;
    const name = readText(item, ["name", "title", "label"]);
    if (!name) continue;
    items.push({ id: readText(item, ["id", "slug"]), name, color: readColor(item) });
  }
  return items;
}

function parseLessonTypes(value: unknown): BuilderLessonType[] {
  if (!Array.isArray(value)) return [];
  const items: BuilderLessonType[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim().length > 0) {
      items.push({ id: null, name: item.trim(), color: null });
      continue;
    }
    if (!isRecord(item)) continue;
    const name = readText(item, ["name", "title", "label"]);
    if (!name) continue;
    items.push({ id: readText(item, ["id", "slug"]), name, color: readColor(item) });
  }
  return items;
}

export function parseDictionaries(payload: unknown): Dictionaries | null {
  if (!isRecord(payload) || payload.ok === false) return null;
  const data = isRecord(payload.data) ? payload.data : payload;
  const rawSubjects = Array.isArray(payload.data)
    ? payload.data
    : data.subjects ?? data.subjectList ?? data.fanlar;
  const rawLessonTypes = data.lessonTypes ?? data.lessonTypeList ?? data.types ?? data.darsTurleri;
  const subjects = parseSubjects(rawSubjects);
  const lessonTypes = parseLessonTypes(rawLessonTypes);
  if (subjects.length === 0 && lessonTypes.length === 0) return null;
  return { subjects, lessonTypes };
}
