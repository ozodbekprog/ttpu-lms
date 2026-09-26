import { ButtonLink } from "@/components/ui";

export const metadata = {
  title: "Sahifa topilmadi",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-6xl font-bold tracking-tight text-slate-200 sm:text-7xl">
          4<span className="text-blue-600">0</span>4
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          Sahifa topilmadi
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Siz izlagan sahifa mavjud emas yoki manzil xato kiritilgan.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <ButtonLink href="/dashboard">Dashboardga qaytish</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Bosh sahifa
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
