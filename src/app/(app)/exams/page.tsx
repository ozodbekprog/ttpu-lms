import { isStaff, requireUser } from "@/lib/auth";
import { getStaffExams, getStudentExams } from "@/components/exams/data";
import { StaffExamCard, StudentExamCard } from "@/components/exams/cards";
import { ExamGroupSection } from "@/components/exams/group";
import { ExamStat } from "@/components/exams/stats";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";

const GROUPS = [
  { key: "upcoming", title: "Kelayotgan", tone: "blue", subtitle: "Rejalashtirilgan nazorat ishlari" },
  { key: "today", title: "Bugun", tone: "amber", subtitle: "Bugun topshirilishi kerak" },
  { key: "past", title: "O'tgan", tone: "slate", subtitle: "Yakunlangan nazorat ishlari" },
] as const;

export default async function ExamsPage() {
  const user = await requireUser();

  if (isStaff(user.role)) {
    const groups = await getStaffExams({ id: user.id, role: user.role });
    const items = [...groups.upcoming, ...groups.today, ...groups.past];
    const submitted = items.reduce((sum, exam) => sum + exam.submittedCount, 0);
    const attempts = items.reduce((sum, exam) => sum + exam.attemptCount, 0);
    const published = items.filter((exam) => exam.isPublished).length;

    return (
      <>
        <PageHeader
          title="Imtihonlar / Nazorat ishlari"
          subtitle={
            user.role === "TEACHER"
              ? "O'qitadigan kurslaringiz bo'yicha nazorat ishlari"
              : "Barcha kurslar bo'yicha nazorat ishlari"
          }
        />
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ExamStat
            icon="clipboard"
            label="Nazorat ishlari"
            value={items.length}
            hint={`${published} ta e'lon qilingan`}
          />
          <ExamStat
            icon="calendar"
            label="Faol"
            value={groups.upcoming.length + groups.today.length}
            hint={`${groups.today.length} ta bugun`}
            tone="amber"
          />
          <ExamStat
            icon="users"
            label="Topshirganlar"
            value={submitted}
            hint={`${attempts} ta urinish`}
            tone="emerald"
          />
          <ExamStat
            icon="check"
            label="Bugungi yuklama"
            value={groups.today.length}
            hint="Bugun yakunlanadigan ishlar"
            tone="rose"
          />
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="Nazorat ishlari yo'q"
            description="Kurslaringizda muddati belgilangan testlar mavjud emas. Yangi nazorat ishi yaratib, muddat belgilang."
            action={
              <ButtonLink href="/quizzes/new" size="sm">
                Nazorat ishi yaratish
              </ButtonLink>
            }
          />
        ) : (
          GROUPS.map((group) => (
            <ExamGroupSection
              key={group.key}
              title={group.title}
              tone={group.tone}
              subtitle={group.subtitle}
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
  const eligible = items.filter((exam) => exam.attendance.eligible).length;
  const submitted = items.filter((exam) => exam.attempts.finished > 0).length;

  return (
    <>
      <PageHeader
        title="Imtihonlar / Nazorat ishlari"
        subtitle={`${user.group?.name ?? "Talaba"} · ${items.length} ta nazorat ishi`}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExamStat
          icon="clipboard"
          label="Nazorat ishlari"
          value={items.length}
          hint={`${groups.past.length} ta yakunlangan`}
        />
        <ExamStat
          icon="calendar"
          label="Kelayotgan"
          value={groups.upcoming.length + groups.today.length}
          hint={`${groups.today.length} ta bugun`}
          tone="amber"
        />
        <ExamStat
          icon="shieldCheck"
          label="Ruxsat bor"
          value={eligible}
          hint="Davomat talabi bajarilgan"
          tone="emerald"
        />
        <ExamStat
          icon="check"
          label="Topshirilgan"
          value={submitted}
          hint={`${items.length - eligible} ta ruxsatsiz`}
          tone="gold"
        />
      </div>
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
            subtitle={group.subtitle}
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
