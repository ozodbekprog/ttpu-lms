import "server-only";
import type { Role } from "@prisma/client";

export type CertificateAccessUser = { id: string; role: Role };

export function canManageCertificate(
  user: CertificateAccessUser,
  certificate: { course: { teacherId: string } },
) {
  return (
    user.role === "ADMIN" ||
    (user.role === "TEACHER" && certificate.course.teacherId === user.id)
  );
}

export function certificateSerial(id: string) {
  return `TTPU-${id.slice(-8).toUpperCase()}`;
}

export type CertificateGradeTone = "green" | "blue" | "amber" | "slate";

export function certificateGrade(grade: number | null | undefined): {
  label: string;
  tone: CertificateGradeTone;
} {
  if (grade == null) return { label: "Baholanmagan", tone: "slate" };
  if (grade >= 90) return { label: "A'lo", tone: "green" };
  if (grade >= 70) return { label: "Yaxshi", tone: "blue" };
  if (grade >= 60) return { label: "Qoniqarli", tone: "amber" };
  return { label: "Qoniqarsiz", tone: "slate" };
}
