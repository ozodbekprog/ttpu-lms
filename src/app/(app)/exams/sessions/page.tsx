import { isStaff, requireUser } from "@/lib/auth";
import {
  getSessionFormOptions,
  getStaffSessions,
  getStudentSessions,
} from "@/components/exams/session-data";
import { StaffSessionCard, StudentSessionCard } from "@/components/exams/session-cards";
import { SectionHeading } from "@/components/exams/session-badges";
import { SessionCreateForm } from "@/components/exams/session-form";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function ExamSessionsPage() {
  const user = await requireUser();

  if (isStaff(user.role)) {
    const [sessions, options] = await Promise.all([
      getStaffSessions({ id: user.id, role: user.role }),
      getSessionFormOptions({ id: user.id, role: user.role }),
    ]);

    return (
      <>
        <PageHeader
          title="Imtihon sessiyalari"
          subtitle={`${sessions.length} ta sessiya · ${options.courses.length} ta kurs`}
        />
        <SessionCreateForm courses={options.courses} terms={options.terms} />
        <SectionHeading
          title="Sessiyalar"
          subtitle="Tur, sana va ro'yxat holati bo'yicha"
        />
        {sessions.length === 0 ? (
          <EmptyState
            title="Sessiyalar yo'q"
            description="Yangi imtihon sessiyasi yaratib, talabalar ro'yxatini shakllantiring."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <StaffSessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </>
    );
  }

  const sessions = await getStudentSessions(user.id);

  return (
    <>
      <PageHeader
        title="Mening imtihonlarim"
        subtitle={`${user.group?.name ?? "Talaba"} · ${sessions.length} ta imtihon sessiyasi`}
      />
      {sessions.length === 0 ? (
        <EmptyState
          title="Imtihon sessiyalari yo'q"
          description="Kurslaringiz bo'yicha imtihon sessiyalari hali e'lon qilinmagan."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <StudentSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </>
  );
}
