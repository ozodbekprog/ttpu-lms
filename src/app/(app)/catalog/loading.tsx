import { Skeleton } from "@/components/ui";
import { CourseBrowserSkeleton } from "@/components/catalog/course-browser-skeleton";

export default function CatalogLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <CourseBrowserSkeleton />
    </div>
  );
}
