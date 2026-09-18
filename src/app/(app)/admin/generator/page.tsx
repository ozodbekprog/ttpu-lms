import { requireRole } from "@/lib/auth";
import { getGeneratorStats } from "@/server/generator";
import { PageHeader } from "@/components/ui";
import GeneratorManager from "@/components/admin/GeneratorManager";

export default async function AdminGeneratorPage() {
  await requireRole(["ADMIN"]);
  const stats = await getGeneratorStats();

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Baza generatori"
        subtitle="MVP uchun tasodifiy demo ma'lumotlar bazasini yaratish"
      />
      <GeneratorManager initial={stats} />
    </>
  );
}
