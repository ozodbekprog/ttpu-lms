import { CatalogCourseCard } from "@/components/catalog/catalog-course-card";

export type ElectiveCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverColor: string;
  teacherName: string;
  materialsCount: number;
  studentsCount: number;
  isEnrolled: boolean;
};

export function ElectiveCourseCard({
  course,
  staff,
}: {
  course: ElectiveCourse;
  staff: boolean;
}) {
  return <CatalogCourseCard course={course} staff={staff} variant="elective" />;
}
