import { requireRole } from "@/lib/auth";
import { buildGroupSummaries, getCuratorGroups } from "@/app/api/curator/data";
import { EmptyState, PageHeader } from "@/components/ui";
import { CuratorGroupCards } from "@/components/curator/group-cards";

export default async function CuratorPage() {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const groups = await getCuratorGroups(user);
  const summaries = await buildGroupSummaries(groups);

  return (
    <>
      <PageHeader
        title="Kurator paneli"
        eyebrow="Guruh rahbari"
        subtitle={
          user.role === "ADMIN"
            ? `Barcha guruhlar: ${summaries.length} ta`
            : `Sizga biriktirilgan guruhlar: ${summaries.length} ta`
        }
      />
      {summaries.length === 0 ? (
        <EmptyState
          title="Guruh biriktirilmagan"
          description="Administrator sizni kurator sifatida guruhga biriktirgach, bu yerda ko'rinadi."
        />
      ) : (
        <CuratorGroupCards groups={summaries} showCurator={user.role === "ADMIN"} />
      )}
    </>
  );
}
