import { requireUser } from "@/lib/auth";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { CheckInForm } from "@/components/attendance/check-in-form";

export default async function AttendanceCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; code?: string }>;
}) {
  const user = await requireUser();
  const { t, code } = await searchParams;

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

  const token = (t ?? "").trim();
  const codeValue = (code ?? "").trim().toUpperCase();
  const initialPayload = token ? { token } : codeValue ? { code: codeValue } : undefined;

  return (
    <>
      <PageHeader
        title="QR orqali davomat"
        subtitle={`${user.name} · QR kodni skanerlang`}
      />
      <CheckInForm initialPayload={initialPayload} />
    </>
  );
}
