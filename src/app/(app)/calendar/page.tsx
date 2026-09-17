import { isStaff, requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="Kalendar"
        subtitle={
          isStaff(user.role)
            ? "Kurslaringiz bo'yicha topshiriq va test muddatlari"
            : "Topshiriq va testlar muddatlari"
        }
      />
      <CalendarView />
    </>
  );
}
