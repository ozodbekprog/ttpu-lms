import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AttendanceStatus, Prisma, Subject } from "@prisma/client";

export type GenerateOptions = {
  groups?: number;
  studentsPerGroup?: number;
};

export type GenerateResult = {
  subjects: number;
  teachers: number;
  groups: number;
  students: number;
  courses: number;
  scheduleEntries: number;
  attendance: number;
};

export type GeneratorCheck = {
  key: string;
  label: string;
  done: boolean;
  value: number;
  target: number;
};

export type GeneratorStats = {
  users: { total: number; admins: number; teachers: number; students: number };
  groups: number;
  subjects: number;
  courses: number;
  rooms: number;
  scheduleEntries: number;
  enrollments: number;
  attendance: number;
  checks: GeneratorCheck[];
};

type TeacherLite = { id: string; name: string };
type GroupLite = { id: string; name: string };
type CourseLite = { id: string; slug: string; subjectId: string | null };

const PASSWORD = "ttpu1234";
const COURSE_LIMIT = 10;

const SUBJECT_NAMES = [
  "Programming",
  "Mathematics 1",
  "Mathematics 2",
  "Physics 1",
  "Physics 2",
  "English 1",
  "English 2",
  "Data Structures",
  "Databases",
  "Web Development",
  "AI Basics",
  "Electronics",
  "Statistics",
  "Discrete Math",
  "Robotics",
  "Machine Learning",
  "Cybersecurity",
  "Chemistry",
  "History of Uzbekistan",
  "Philosophy",
  "Economics",
  "Academic Writing",
  "Linear Algebra",
  "Operating Systems",
  "Computer Networks",
  "Cloud Computing",
] as const;

const TEACHER_NAMES = [
  { first: "Aziz", last: "Karimov" },
  { first: "Dilnoza", last: "Yusupova" },
  { first: "Sardor", last: "Tursunov" },
  { first: "Malika", last: "Rasuleva" },
  { first: "Jasur", last: "Abdullayev" },
  { first: "Nilufar", last: "Ergasheva" },
  { first: "Bekzod", last: "Sattorov" },
  { first: "Kamila", last: "Islomova" },
] as const;

const GROUP_NAMES = ["CS-25", "CS-26", "EE-25", "ME-25", "SE-25"] as const;

const FIRST_NAMES = [
  "Aziz",
  "Bekzod",
  "Dilnoza",
  "Farrux",
  "Gulnora",
  "Jasur",
  "Kamila",
  "Laziza",
  "Mirjalol",
  "Nodira",
  "Oybek",
  "Rustam",
  "Sevara",
  "Timur",
  "Umida",
  "Zafar",
  "Shahzoda",
  "Islom",
  "Madina",
  "Doniyor",
] as const;

const LAST_NAMES = [
  "Karimov",
  "Yusupova",
  "Tursunov",
  "Rasuleva",
  "Abdullayev",
  "Ergasheva",
  "Sattorov",
  "Islomova",
  "Qodirov",
  "Mirzayeva",
  "Xolmatov",
  "Norova",
  "Bekmurodov",
  "Saidova",
  "Aliyev",
  "Yuldasheva",
] as const;

const LESSON_TYPES = ["Ma'ruza", "Amaliyot", "Laboratoriya"] as const;

const SUBJECT_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0f766e",
  "#b45309",
] as const;

const FALLBACK_ROOMS = [
  "101-xona",
  "102-xona",
  "201-xona",
  "202-xona",
  "301-xona",
  "302-xona",
  "401-xona",
] as const;

const ATTENDANCE_PLAN: { status: AttendanceStatus; weight: number }[] = [
  { status: "PRESENT", weight: 70 },
  { status: "LATE", weight: 10 },
  { status: "EXCUSED", weight: 8 },
  { status: "ABSENT", weight: 12 },
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const temp = result[index];
    result[index] = result[swap];
    result[swap] = temp;
  }
  return result;
}

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swap = state % (index + 1);
    const temp = result[index];
    result[index] = result[swap];
    result[swap] = temp;
  }
  return result;
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function userEmail(first: string, last: string, suffix?: number) {
  return `${slugify(first)}.${slugify(last)}${suffix ?? ""}@ttpu.uz`;
}

function groupSlotKey(groupId: string, day: number, slot: number) {
  return `${groupId}|${day}|${slot}`;
}

function pickAttendanceStatus(): AttendanceStatus {
  const total = ATTENDANCE_PLAN.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of ATTENDANCE_PLAN) {
    roll -= item.weight;
    if (roll < 0) return item.status;
  }
  return "PRESENT";
}

function lastWorkingDays(count: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (dates.length < count) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates;
}

export async function generateBaseData(opts: GenerateOptions = {}): Promise<GenerateResult> {
  const groupCount = Math.min(Math.max(Math.trunc(opts.groups ?? 5), 1), GROUP_NAMES.length);
  const perGroup = Math.min(Math.max(Math.trunc(opts.studentsPerGroup ?? 8), 4), 20);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  let subjectsCreated = 0;
  const subjectRecords: Subject[] = [];
  const existingSubjects = await prisma.subject.findMany({ where: { name: { in: [...SUBJECT_NAMES] } } });
  const subjectByName = new Map(existingSubjects.map((item) => [item.name, item]));
  for (const name of SUBJECT_NAMES) {
    const found = subjectByName.get(name);
    if (found) {
      subjectRecords.push(found);
      continue;
    }
    const created = await prisma.subject.create({ data: { name, color: pick(SUBJECT_COLORS) } });
    subjectByName.set(name, created);
    subjectRecords.push(created);
    subjectsCreated += 1;
  }

  let teachersCreated = 0;
  const teacherRecords: TeacherLite[] = [];
  const teacherEmails = TEACHER_NAMES.map((item) => userEmail(item.first, item.last));
  const existingTeachers = await prisma.user.findMany({
    where: { email: { in: teacherEmails } },
    select: { id: true, email: true, name: true },
  });
  const teacherByEmail = new Map(existingTeachers.map((item) => [item.email, item]));
  for (const item of TEACHER_NAMES) {
    const email = userEmail(item.first, item.last);
    const found = teacherByEmail.get(email);
    if (found) {
      teacherRecords.push({ id: found.id, name: found.name });
      continue;
    }
    const created = await prisma.user.create({
      data: { email, name: `${item.first} ${item.last}`, role: "TEACHER", passwordHash },
    });
    teacherRecords.push({ id: created.id, name: created.name });
    teachersCreated += 1;
  }

  let groupsCreated = 0;
  const newGroupIds: string[] = [];
  const groupRecords: GroupLite[] = [];
  for (const name of GROUP_NAMES.slice(0, groupCount)) {
    const existing = await prisma.group.findUnique({ where: { name } });
    if (existing) {
      groupRecords.push({ id: existing.id, name: existing.name });
      continue;
    }
    const created = await prisma.group.create({
      data: { name, year: 2000 + Number(name.slice(-2)) },
    });
    groupRecords.push({ id: created.id, name: created.name });
    newGroupIds.push(created.id);
    groupsCreated += 1;
  }

  let studentsCreated = 0;
  if (newGroupIds.length > 0) {
    const existingStudents = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { email: true },
    });
    const usedEmails = new Set(existingStudents.map((item) => item.email));
    for (const groupId of newGroupIds) {
      for (let index = 0; index < perGroup; index += 1) {
        const first = pick(FIRST_NAMES);
        const last = pick(LAST_NAMES);
        let email = userEmail(first, last);
        let suffix = 2;
        while (usedEmails.has(email)) {
          email = userEmail(first, last, suffix);
          suffix += 1;
        }
        usedEmails.add(email);
        await prisma.user.create({
          data: { email, name: `${first} ${last}`, role: "STUDENT", passwordHash, groupId },
        });
        studentsCreated += 1;
      }
    }
  }

  let coursesCreated = 0;
  const targetSlugs = SUBJECT_NAMES.map((name) => slugify(name));
  const existingCourses = await prisma.course.findMany({
    where: { slug: { in: targetSlugs } },
    select: { id: true, slug: true, subjectId: true },
  });
  const courseBySlug = new Map<string, CourseLite>(existingCourses.map((item) => [item.slug, item]));
  let courseBudget = Math.max(0, COURSE_LIMIT - existingCourses.length);
  for (const subject of subjectRecords) {
    if (courseBudget <= 0) break;
    const slug = slugify(subject.name);
    if (courseBySlug.has(slug)) continue;
    const created = await prisma.course.create({
      data: {
        title: subject.name,
        slug,
        description: `${subject.name} fanidan amaliy kurs`,
        coverColor: subject.color,
        isPublished: true,
        isElective: Math.random() < 0.2,
        subjectId: subject.id,
        teacherId: pick(teacherRecords).id,
      },
      select: { id: true, slug: true, subjectId: true },
    });
    courseBySlug.set(slug, created);
    courseBudget -= 1;
    coursesCreated += 1;
  }
  const targetCourses = [...courseBySlug.values()];

  let scheduleEntriesCreated = 0;
  const roomRows = await prisma.room.findMany({ select: { name: true } });
  const rooms = roomRows.length > 0 ? roomRows.map((item) => item.name) : [...FALLBACK_ROOMS];
  const existingEntries = await prisma.scheduleEntry.findMany({
    select: { groupId: true, dayOfWeek: true, slot: true, teacher: true, room: true },
  });
  const groupBusy = new Set(existingEntries.map((item) => groupSlotKey(item.groupId, item.dayOfWeek, item.slot)));
  const groupHasEntries = new Set(existingEntries.map((item) => item.groupId));
  const teacherBusy = new Set(
    existingEntries.flatMap((item) =>
      item.teacher ? [`${item.dayOfWeek}|${item.slot}|${item.teacher}`] : [],
    ),
  );
  const roomBusy = new Set(
    existingEntries.flatMap((item) => (item.room ? [`${item.dayOfWeek}|${item.slot}|${item.room}`] : [])),
  );

  for (const group of groupRecords) {
    if (groupHasEntries.has(group.id)) continue;
    const candidates: { day: number; slot: number }[] = [];
    for (let day = 1; day <= 6; day += 1) {
      for (let slot = 1; slot <= 8; slot += 1) candidates.push({ day, slot });
    }
    const target = randomInt(12, 16);
    const rows: Prisma.ScheduleEntryCreateManyInput[] = [];
    for (const candidate of shuffle(candidates)) {
      if (rows.length >= target) break;
      const key = groupSlotKey(group.id, candidate.day, candidate.slot);
      if (groupBusy.has(key)) continue;
      const teacher = shuffle(teacherRecords).find(
        (item) => !teacherBusy.has(`${candidate.day}|${candidate.slot}|${item.name}`),
      );
      if (!teacher) continue;
      const room = shuffle(rooms).find(
        (name) => !roomBusy.has(`${candidate.day}|${candidate.slot}|${name}`),
      );
      if (!room) continue;
      const subject = pick(subjectRecords);
      rows.push({
        groupId: group.id,
        dayOfWeek: candidate.day,
        slot: candidate.slot,
        subject: subject.name,
        subjectId: subject.id,
        lessonType: pick(LESSON_TYPES),
        teacher: teacher.name,
        room,
        parity: null,
      });
      groupBusy.add(key);
      teacherBusy.add(`${candidate.day}|${candidate.slot}|${teacher.name}`);
      roomBusy.add(`${candidate.day}|${candidate.slot}|${room}`);
    }
    if (rows.length > 0) {
      const result = await prisma.scheduleEntry.createMany({ data: rows });
      scheduleEntriesCreated += result.count;
    }
  }

  const targetGroupIds = groupRecords.map((item) => item.id);
  const targetCourseIds = targetCourses.map((item) => item.id);
  const scheduleRows = await prisma.scheduleEntry.findMany({
    where: { groupId: { in: targetGroupIds } },
    select: { groupId: true, subjectId: true },
  });
  const subjectIdsByGroup = new Map<string, Set<string>>();
  for (const row of scheduleRows) {
    if (!row.subjectId) continue;
    const set = subjectIdsByGroup.get(row.groupId) ?? new Set<string>();
    set.add(row.subjectId);
    subjectIdsByGroup.set(row.groupId, set);
  }
  const groupStudents = await prisma.user.findMany({
    where: { groupId: { in: targetGroupIds }, role: "STUDENT" },
    select: { id: true, groupId: true },
  });
  for (const group of groupRecords) {
    const students = groupStudents.filter((item) => item.groupId === group.id);
    if (students.length === 0) continue;
    const subjectIds = subjectIdsByGroup.get(group.id) ?? new Set<string>();
    const matched = targetCourses.filter((item) => item.subjectId !== null && subjectIds.has(item.subjectId));
    const pool = (matched.length >= 3 ? matched : targetCourses).sort((a, b) => a.slug.localeCompare(b.slug));
    if (pool.length === 0) continue;
    for (const student of students) {
      const seed = hashSeed(student.id);
      const take = Math.min(3 + (seed % 3), pool.length);
      const chosen = seededShuffle(pool, seed).slice(0, take);
      if (chosen.length === 0) continue;
      await prisma.enrollment.createMany({
        data: chosen.map((course) => ({ courseId: course.id, userId: student.id })),
        skipDuplicates: true,
      });
    }
  }

  let attendanceCreated = 0;
  const targetStudentIds = groupStudents.map((item) => item.id);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: targetCourseIds }, userId: { in: targetStudentIds } },
    select: { courseId: true, userId: true },
  });
  const dates = lastWorkingDays(10);
  const attendanceRows: Prisma.AttendanceCreateManyInput[] = [];
  for (const enrollment of enrollments) {
    for (const date of dates) {
      attendanceRows.push({
        courseId: enrollment.courseId,
        studentId: enrollment.userId,
        date,
        status: pickAttendanceStatus(),
      });
    }
  }
  if (attendanceRows.length > 0) {
    const result = await prisma.attendance.createMany({ data: attendanceRows, skipDuplicates: true });
    attendanceCreated = result.count;
  }

  return {
    subjects: subjectsCreated,
    teachers: teachersCreated,
    groups: groupsCreated,
    students: studentsCreated,
    courses: coursesCreated,
    scheduleEntries: scheduleEntriesCreated,
    attendance: attendanceCreated,
  };
}

export async function getGeneratorStats(): Promise<GeneratorStats> {
  const teacherEmails = TEACHER_NAMES.map((item) => userEmail(item.first, item.last));
  const targetSlugs = SUBJECT_NAMES.map((name) => slugify(name));
  const [total, admins, teachers, students, groups, subjects, courses, rooms, scheduleEntries, enrollments, attendance] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { email: { in: teacherEmails } } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.group.count({ where: { name: { in: [...GROUP_NAMES] } } }),
      prisma.subject.count({ where: { name: { in: [...SUBJECT_NAMES] } } }),
      prisma.course.count({ where: { slug: { in: targetSlugs } } }),
      prisma.room.count(),
      prisma.scheduleEntry.count(),
      prisma.enrollment.count(),
      prisma.attendance.count(),
    ]);

  const checks: GeneratorCheck[] = [
    {
      key: "subjects",
      label: "Fanlar",
      done: subjects >= SUBJECT_NAMES.length,
      value: subjects,
      target: SUBJECT_NAMES.length,
    },
    {
      key: "teachers",
      label: "O'qituvchilar",
      done: teachers >= TEACHER_NAMES.length,
      value: teachers,
      target: TEACHER_NAMES.length,
    },
    {
      key: "groups",
      label: "Guruhlar",
      done: groups >= GROUP_NAMES.length,
      value: groups,
      target: GROUP_NAMES.length,
    },
    {
      key: "courses",
      label: "Kurslar",
      done: courses >= COURSE_LIMIT,
      value: courses,
      target: COURSE_LIMIT,
    },
    {
      key: "scheduleEntries",
      label: "Jadval yozuvlari",
      done: scheduleEntries > 0,
      value: scheduleEntries,
      target: 0,
    },
    {
      key: "attendance",
      label: "Davomat yozuvlari",
      done: attendance > 0,
      value: attendance,
      target: 0,
    },
  ];

  return {
    users: { total, admins, teachers, students },
    groups,
    subjects,
    courses,
    rooms,
    scheduleEntries,
    enrollments,
    attendance,
    checks,
  };
}
