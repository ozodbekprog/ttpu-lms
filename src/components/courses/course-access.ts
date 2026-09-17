import "server-only";
import type { MaterialType, Role } from "@prisma/client";

export type AccessUser = { id: string; role: Role };

export function canManageCourse(user: AccessUser, course: { teacherId: string }) {
  return user.role === "ADMIN" || (user.role === "TEACHER" && course.teacherId === user.id);
}

export function canViewCourse(
  user: AccessUser,
  course: { teacherId: string; isPublished: boolean },
  isEnrolled: boolean,
) {
  return canManageCourse(user, course) || course.isPublished || isEnrolled;
}

export function materialRuleError(
  type: MaterialType,
  content: string | null | undefined,
  fileUrl: string | null | undefined,
) {
  if (type === "TEXT" && !content) return "Matn kiritilishi shart";
  if ((type === "LINK" || type === "VIDEO") && !content) return "Havola (URL) kiritilishi shart";
  if (type === "FILE" && !fileUrl) return "Fayl havolasi (URL) kiritilishi shart";
  return null;
}
