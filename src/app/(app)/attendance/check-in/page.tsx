import { requireUser } from "@/lib/auth";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { CheckInForm } from "@/components/attendance/check-in-form";

export default async function AttendanceCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; t?: string }>;
}) {
  const user = await requireUser();
  const { code, t } = await searchParams;

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

  const initialCode = (code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const initialToken = (t ?? "").trim() || undefined;

  return (
    <>
      <PageHeader
        title="QR orqali davomat"
        subtitle={`${user.name} · 6 belgili kodni kiriting`}
      />
      <CheckInForm initialCode={initialCode} initialToken={initialToken} />
    </>
  );
}
