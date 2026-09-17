import { Card, CardBody, Skeleton } from "@/components/ui";

export default function NotificationsLoading() {
  return (
    <div>
      <div className="mb-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardBody className="flex items-start gap-3">
              <Skeleton className="size-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
