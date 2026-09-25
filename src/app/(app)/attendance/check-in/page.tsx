import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getModuleFlags } from "@/server/settings";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { CheckInForm } from "@/components/attendance/check-in-form";

export default async function AttendanceCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const initialCode = (code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const user = await getCurrentUser();
  const flags = await getModuleFlags();

  if (!user) {
    const base = "/attendance/check-in";
    const loginNext = initialCode ? `${base}?code=${initialCode}` : base;
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }

  if (!flags.qr_attendance) {
    return (
      <>
        <PageHeader title="QR orqali davomat" subtitle="Vaqtincha o'chirilgan" />
        <EmptyState
          title="QR davomat o'chirilgan"
          description="Administrator QR davomat modulini vaqtincha o'chirgan. Keyinroq qayta urinib ko'ring."
        />
      </>
    );
  }

  if (user.role !== "STUDENT") {
    return (
      <>
        <PageHeader title="QR orqali davomat" subtitle="Talabalar uchun" />
        <EmptyState
          title="Bu sahifa talabalar uchun"
          description="O'qituvchi sifatida davomatni kurs sahifasidagi QR panel orqali boshqarasiz."
          action={
            <ButtonLink href="/courses" variant="secondary" size="sm" className="mt-2">
              Kurslarga o&apos;tish
            </ButtonLink>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="QR orqali davomat"
        subtitle={`${user.name} · 6 belgili kodni kiriting`}
      />
      <CheckInForm initialCode={initialCode} />
    </>
  );
}
