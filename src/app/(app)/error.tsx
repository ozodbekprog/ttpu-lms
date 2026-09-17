"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Card, CardBody } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-3 px-8 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-rose-50 text-2xl font-semibold text-rose-600">
            !
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Nimadir xato ketdi</h2>
          <p className="text-sm text-slate-500">
            Sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko&apos;ring yoki
            dashboardga qayting.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => reset()}>Qayta urinish</Button>
            <ButtonLink href="/dashboard" variant="secondary">
              Dashboardga qaytish
            </ButtonLink>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
