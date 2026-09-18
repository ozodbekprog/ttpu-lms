import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui";
import { buildWorkloadData, formatHours } from "@/components/workload/workload-data";
import {
  WorkloadTeachersTable,
  parseWorkloadSort,
  sortWorkloadTeachers,
} from "@/components/workload/workload-teachers-table";
import { WorkloadCoursesTable } from "@/components/workload/workload-courses-table";

export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; sort?: string; dir?: string }>;
}) {
  const user = await requireRole(["TEACHER", "ADMIN"]);
  const params = await searchParams;
  const requestedTeacherId =
    typeof params.teacherId === "string" && params.teacherId.length > 0 ? params.teacherId : null;
  const teacherId = user.role === "TEACHER" ? user.id : requestedTeacherId;

  const data = await buildWorkloadData({
    teacherId,
    includeAllTeachers: user.role === "ADMIN",
  });

  const { sort, dir } = parseWorkloadSort(params.sort, params.dir);
  const teachers = sortWorkloadTeachers(data.teachers, sort, dir);
  const selectedTeacher = teacherId
    ? data.teachers.find((teacher) => teacher.id === teacherId) ?? null
    : null;
  const scopeName = user.role === "TEACHER" ? user.name : selectedTeacher?.name ?? null;

  return (
    <>
      <PageHeader
        title="Yuklama"
        eyebrow={user.role === "ADMIN" ? "Administrator paneli" : "O'qituvchi paneli"}
        subtitle={
          scopeName
            ? `${scopeName} · ${data.summary.courseCount} ta kurs`
            : `Barcha o'qituvchilar · ${data.summary.courseCount} ta kurs`
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Kurslar"
          value={data.summary.courseCount}
          hint={scopeName ? "Biriktirilgan kurslar" : "Tizimdagi barcha kurslar"}
        />
        <Stat
          label="Talabalar"
          value={data.summary.studentCount}
          hint="Kurslarga yozilgan talabalar"
        />
        <Stat
          label="Kutilayotgan baholash"
          value={data.summary.pendingReviews}
          hint="Topshiriq va matnli javoblar"
        />
        <Stat
          label="Haftalik soatlar"
          value={formatHours(data.summary.weeklyHours)}
          hint="Jadval: 1 dars = 1.5 soat"
        />
      </div>

      {user.role === "ADMIN" ? (
        <Card className="mt-6">
          <CardHeader
            title="O'qituvchilar jadvali"
            subtitle={`${data.teachers.length} ta o'qituvchi`}
          />
          <CardBody>
            {data.teachers.length === 0 ? (
              <EmptyState
                title="O'qituvchilar topilmadi"
                description="Tizimda o'qituvchi roli foydalanuvchilari yo'q."
              />
            ) : (
              <WorkloadTeachersTable
                teachers={teachers}
                sort={sort}
                dir={dir}
                activeTeacherId={teacherId}
              />
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader
          title="Kurslar bo'yicha yuklama"
          subtitle={selectedTeacher ? selectedTeacher.name : "Barcha kurslar"}
          action={
            user.role === "ADMIN" && teacherId ? (
              <Link
                href="/workload"
                className="text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-brand-800"
              >
                Barchasi
              </Link>
            ) : undefined
          }
        />
        <CardBody>
          {data.courses.length === 0 ? (
            <EmptyState
              title="Kurslar topilmadi"
              description="Bu doirada yuklama hisoblanadigan kurslar mavjud emas."
            />
          ) : (
            <WorkloadCoursesTable
              courses={data.courses}
              showTeacher={user.role === "ADMIN" && !teacherId}
            />
          )}
        </CardBody>
      </Card>
    </>
  );
}
