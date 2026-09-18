import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { SearchForm } from "@/components/search/search-form";
import { SearchResultsView } from "@/components/search/search-results";
import { SEARCH_MIN_LENGTH, searchAll } from "@/components/search/search-data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const active = query.length >= SEARCH_MIN_LENGTH;
  const data = await searchAll(user, query);

  return (
    <>
      <PageHeader
        eyebrow="Qidiruv"
        title="Global qidiruv"
        subtitle="Kurslar, materiallar, topshiriqlar, testlar va foydalanuvchilar bo'yicha"
      />
      <SearchForm defaultValue={query} />
      {active ? (
        <SearchResultsView query={query} data={data} />
      ) : (
        <EmptyState
          title={query ? "So'rov juda qisqa" : "Nimani qidiramiz?"}
          description={
            query
              ? `"${query}" bo'yicha qidirish uchun kamida ${SEARCH_MIN_LENGTH} ta belgi kiriting.`
              : `Kamida ${SEARCH_MIN_LENGTH} ta belgi kiriting — natijalar kurslar, materiallar, topshiriqlar, testlar va foydalanuvchilarga bo'linadi.`
          }
        />
      )}
    </>
  );
}
