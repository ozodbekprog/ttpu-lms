import { prisma } from "@/lib/prisma";

export const DEFAULT_TIME_SLOTS = [
  { slot: 1, startTime: "09:00", endTime: "10:20" },
  { slot: 2, startTime: "10:30", endTime: "11:50" },
  { slot: 3, startTime: "12:00", endTime: "13:20" },
  { slot: 4, startTime: "14:20", endTime: "15:40" },
  { slot: 5, startTime: "15:50", endTime: "17:10" },
  { slot: 6, startTime: "17:20", endTime: "18:40" },
  { slot: 7, startTime: "18:50", endTime: "20:10" },
  { slot: 8, startTime: "20:20", endTime: "21:40" },
];

export const DEFAULT_LESSON_TYPES = [
  { name: "Ma'ruza", color: "#3f5a9d" },
  { name: "Amaliy", color: "#10b981" },
  { name: "Laboratoriya", color: "#f59e0b" },
  { name: "Seminar", color: "#a855f7" },
];

export async function ensureDictionaryDefaults() {
  const [timeSlotCount, lessonTypeCount] = await Promise.all([
    prisma.timeSlot.count(),
    prisma.lessonType.count(),
  ]);

  if (timeSlotCount === 0) {
    await prisma.timeSlot.createMany({ data: DEFAULT_TIME_SLOTS, skipDuplicates: true });
  }

  if (lessonTypeCount === 0) {
    await prisma.lessonType.createMany({ data: DEFAULT_LESSON_TYPES, skipDuplicates: true });
  }
}

export async function listDictionaries() {
  const [subjects, timeSlots, lessonTypes] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.timeSlot.findMany({ orderBy: { slot: "asc" } }),
    prisma.lessonType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { subjects, timeSlots, lessonTypes };
}
