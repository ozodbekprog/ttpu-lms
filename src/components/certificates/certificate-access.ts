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
