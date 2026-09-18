import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import SettingsManager, { type SettingsModule } from "@/components/admin/SettingsManager";
import { MODULE_KEYS, MODULE_META, getModuleFlags } from "@/server/settings";

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN"]);
  const flags = await getModuleFlags();

  const modules: SettingsModule[] = MODULE_KEYS.map((key) => ({
    key,
    title: MODULE_META[key].title,
    description: MODULE_META[key].description,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Sozlamalar"
        subtitle="Modullarni yoqing yoki o'chiring — o'zgarish darhol kuchga kiradi"
      />
      <SettingsManager modules={modules} initialFlags={flags} />
    </>
  );
}
