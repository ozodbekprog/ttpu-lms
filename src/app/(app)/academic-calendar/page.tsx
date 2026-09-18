import { isStaff, requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AcademicCalendarView } from "@/components/academic-calendar/academic-calendar-view";

export default async function AcademicCalendarPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="O'quv kalendari"
        subtitle={
          isStaff(user.role)
            ? "O'quv yili tadbirlari — qo'shish, tahrirlash va o'chirish mumkin"
            : "O'quv yili tadbirlari va muhim sanalar"
        }
      />
      <AcademicCalendarView canManage={isStaff(user.role)} />
    </>
  );
}
