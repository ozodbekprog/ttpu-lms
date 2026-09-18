import { isStaff, requireUser } from "@/lib/auth";
import { getStaffExams, getStudentExams } from "@/components/exams/data";
import { StaffExamCard, StudentExamCard } from "@/components/exams/cards";
import { ExamGroupSection } from "@/components/exams/group";
import { EmptyState, PageHeader } from "@/components/ui";

const GROUPS = [
  { key: "upcoming", title: "Kelayotgan", tone: "blue" },
  { key: "today", title: "Bugun", tone: "amber" },
  { key: "past", title: "O'tgan", tone: "slate" },
] as const;

export default async function ExamsPage() {
  const user = await requireUser();

  if (isStaff(user.role)) {
    const groups = await getStaffExams({ id: user.id, role: user.role });
    const items = [...groups.upcoming, ...groups.today, ...groups.past];
    const submitted = items.reduce((sum, exam) => sum + exam.submittedCount, 0);

    return (
      <>
        <PageHeader
          title="Imtihonlar / Nazorat ishlari"
          subtitle={
            user.role === "TEACHER"
              ? `O'qitadigan kurslaringiz · ${items.length} ta nazorat ishi · ${submitted} ta topshirilgan`
              : `Barcha kurslar · ${items.length} ta nazorat ishi · ${submitted} ta topshirilgan`
          }
        />
        {items.length === 0 ? (
          <EmptyState
            title="Nazorat ishlari yo'q"
            description="Kurslaringizda muddati belgilangan testlar mavjud emas."
          />
        ) : (
          GROUPS.map((group) => (
            <ExamGroupSection
              key={group.key}
              title={group.title}
              tone={group.tone}
              count={groups[group.key].length}
            >
              {groups[group.key].map((exam) => (
                <StaffExamCard key={exam.id} exam={exam} />
              ))}
            </ExamGroupSection>
          ))
        )}
      </>
    );
  }

  const groups = await getStudentExams(user.id);
  const items = [...groups.upcoming, ...groups.today, ...groups.past];

  return (
    <>
      <PageHeader
        title="Imtihonlar / Nazorat ishlari"
        subtitle={`${user.group?.name ?? "Talaba"} · ${items.length} ta nazorat ishi`}
      />
      {items.length === 0 ? (
        <EmptyState
          title="Nazorat ishlari yo'q"
          description="Kurslaringizda muddati belgilangan e'lon qilingan test yo'q."
        />
      ) : (
        GROUPS.map((group) => (
          <ExamGroupSection
            key={group.key}
            title={group.title}
            tone={group.tone}
            count={groups[group.key].length}
          >
            {groups[group.key].map((exam) => (
              <StudentExamCard key={exam.id} exam={exam} />
            ))}
          </ExamGroupSection>
        ))
      )}
    </>
  );
}
