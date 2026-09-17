import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 px-6">
      <div className="w-full max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
          Turin Politexnika Universiteti
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          TTPU LMS
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Kurslar, topshiriqlar, testlar va dars jadvali — barchasi bitta zamonaviy
          platformada.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <ButtonLink href="/login" size="md">
            Kirish
          </ButtonLink>
          <ButtonLink href="/register" variant="secondary">
            Ro'yxatdan o'tish
          </ButtonLink>
        </div>
        <p className="mt-10 text-xs text-slate-400">
          Demo: ozodbek@ttpu.uz / ttpu1234
        </p>
      </div>
      <footer className="absolute bottom-6 text-xs text-slate-400">
        <Link href="/login" className="hover:text-slate-600">
          TTPU LMS demo
        </Link>
      </footer>
    </main>
  );
}
