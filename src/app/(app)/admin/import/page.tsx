import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import ImportManager from "@/components/admin/ImportManager";

export default async function AdminImportPage() {
  await requireRole(["ADMIN"]);

  return (
    <>
      <PageHeader
        title="CSV import"
        subtitle="Talabalar, guruhlar va fanlarni CSV fayl orqali ommaviy yuklang"
      />
      <ImportManager />
    </>
  );
}
