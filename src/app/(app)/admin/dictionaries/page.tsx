import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import DictionariesManager from "@/components/admin/DictionariesManager";
import { ensureDictionaryDefaults } from "@/app/api/dictionaries/data";

export default async function AdminDictionariesPage() {
  await requireRole(["ADMIN"]);
  await ensureDictionaryDefaults();

  const [subjects, timeSlots, lessonTypes] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: {
        teachers: {
          orderBy: { teacher: { name: "asc" } },
          select: { teacher: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.timeSlot.findMany({ orderBy: { slot: "asc" } }),
    prisma.lessonType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Lug'atlar"
        subtitle="Fanlar, dars vaqtlari va dars turlarini boshqarish"
      />
      <DictionariesManager
        subjects={subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          color: subject.color,
          teachers: subject.teachers.map((item) => item.teacher),
        }))}
        timeSlots={timeSlots}
        lessonTypes={lessonTypes}
      />
    </>
  );
}
