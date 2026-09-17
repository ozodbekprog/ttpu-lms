import type { Role } from "@prisma/client";

export type StaffUser = { role: Role; name: string };
export type TeacherOwnedEntry = { teacher: string | null };

export function normalizeTeacher(name: string): string {
  return name.replace(/\./g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function canManageEntry(user: StaffUser, entry: TeacherOwnedEntry): boolean {
  if (user.role === "ADMIN") return true;
  if (!entry.teacher) return false;
  return normalizeTeacher(entry.teacher) === normalizeTeacher(user.name);
}
