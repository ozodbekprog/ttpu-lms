import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCertificate } from "@/components/certificates/certificate-access";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    select: { id: true, course: { select: { teacherId: true } } },
  });
  if (!certificate) {
    return Response.json({ ok: false, error: "Sertifikat topilmadi" }, { status: 404 });
  }

  if (user.role === "STUDENT" || !canManageCertificate(user, certificate)) {
    return Response.json(
      { ok: false, error: "Bu sertifikatni bekor qilish huquqingiz yo'q" },
      { status: 403 },
    );
  }

  await prisma.certificate.delete({ where: { id: certificate.id } });

  return Response.json({ ok: true, data: { id: certificate.id } });
}
