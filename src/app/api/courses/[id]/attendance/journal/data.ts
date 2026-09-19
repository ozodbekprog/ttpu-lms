import "server-only";
import { prisma } from "@/lib/prisma";
import { attendanceCounts } from "@/app/api/attendance/summary/data";
import type { AttendanceStatus } from "@prisma/client";
import type {
  JournalData,
  JournalDateTotal,
  JournalStatus,
} from "@/components/attendance/journal-utils";

const MAX_DATES = 20;

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getAttendanceJournal(courseId: string): Promise<JournalData> {
  const [enrollments, rows] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId, user: { isActive: true } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            subGroup: { select: { name: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.attendance.findMany({
      where: { courseId },
      select: { studentId: true, date: true, status: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const students = enrollments.map((enrollment) => ({
    id: enrollment.user.id,
    name: enrollment.user.name,
    avatarUrl: enrollment.user.avatarUrl,
    subGroup: enrollment.user.subGroup?.name ?? null,
  }));
  const activeIds = new Set(students.map((student) => student.id));
  const dates = [...new Set(rows.map((row) => isoDay(row.date)))].sort().slice(-MAX_DATES);
  const dateSet = new Set(dates);

  const records: Record<string, Record<string, JournalStatus>> = {};
  for (const student of students) records[student.id] = {};

  const statusesByStudent = new Map<string, AttendanceStatus[]>();
  const totalsByDate = new Map<string, { attended: number; total: number }>();

  for (const row of rows) {
    const key = isoDay(row.date);
    if (!dateSet.has(key) || !activeIds.has(row.studentId)) continue;
    records[row.studentId][key] = row.status;
    const statuses = statusesByStudent.get(row.studentId);
    if (statuses) {
      statuses.push(row.status);
    } else {
      statusesByStudent.set(row.studentId, [row.status]);
    }
    const totals = totalsByDate.get(key) ?? { attended: 0, total: 0 };
    totals.total += 1;
    if (row.status !== "ABSENT") totals.attended += 1;
    totalsByDate.set(key, totals);
  }

  const summary: JournalData["summary"] = {};
  for (const student of students) {
    summary[student.id] = attendanceCounts(statusesByStudent.get(student.id) ?? []);
  }

  const dateTotals: JournalDateTotal[] = dates.map((date) => ({
    date,
    attended: totalsByDate.get(date)?.attended ?? 0,
    total: totalsByDate.get(date)?.total ?? 0,
  }));

  return { students, dates, records, summary, dateTotals };
}
