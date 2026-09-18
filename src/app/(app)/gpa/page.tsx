import { requireUser } from "@/lib/auth";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getStudentGpa } from "@/app/api/gpa/data";
import { GpaCourseTable } from "@/components/gpa/gpa-course-table";
import { GpaEmpty } from "@/components/gpa/gpa-empty";
import { GpaHero } from "@/components/gpa/gpa-hero";
import { GpaScale } from "@/components/gpa/gpa-scale";

export default async function GpaPage() {
  const user = await requireUser();

  if (user.role !== "STUDENT") {
    return (
      <>
        <PageHeader title="GPA" subtitle="4.0 baholash tizimi" eyebrow="Akademik natija" />
        <GpaEmpty
          title="Talaba hisobi kerak"
          description="GPA bo'limi talaba hisobida to'liq ko'rinadi: kurslar kesimida o'rtacha foiz, harf baho va umumiy GPA."
        />
      </>
    );
  }

  const data = await getStudentGpa(user.id);

  if (data.gpa == null || data.courses.length === 0) {
    return (
      <>
        <PageHeader
          title="GPA"
          subtitle={`${user.group?.name ?? "Talaba"} · 4.0 baholash tizimi`}
          eyebrow="Akademik natija"
        />
        <GpaEmpty
          title="GPA hali hisoblanmagan"
          description="Baholangan topshiriq yoki testlar paydo bo'lgach, GPA shu yerda avtomatik hisoblanadi."
          action={<ButtonLink href="/courses">Kurslarni ko&apos;rish</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="GPA"
        subtitle={`${user.group?.name ?? "Talaba"} · 4.0 baholash tizimi`}
        eyebrow="Akademik natija"
      />
      <GpaHero data={data} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_21rem]">
        <GpaCourseTable data={data} delay={80} />
        <GpaScale delay={160} />
      </div>
    </>
  );
}
