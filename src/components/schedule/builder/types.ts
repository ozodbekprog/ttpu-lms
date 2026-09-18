import type { ScheduleEntryItem, ScheduleStatus } from "@/components/schedule/types";

export type BuilderGroup = { id: string; name: string };

export type BuilderCourse = {
  id: string;
  title: string;
  teacherName: string | null;
  subjectId: string | null;
  coverColor: string | null;
};

export type BuilderSubject = { id: string | null; name: string; color: string | null };

export type BuilderLessonType = { id: string | null; name: string; color: string | null };

export type BuilderSubjectRef = { name: string; color: string | null };

export type BuilderEntry = {
  id: string;
  groupId: string;
  dayOfWeek: number;
  slot: number;
  subject: string;
  subjectId: string | null;
  lessonType: string | null;
  subjectRef: BuilderSubjectRef | null;
  teacher: string | null;
  room: string | null;
  parity: string | null;
  status: ScheduleStatus;
  note: string | null;
};

export type CellRef = { day: number; slot: number };

export type DragPayload =
  | { kind: "new"; subject: string; subjectId: string | null }
  | { kind: "move"; id: string; subject: string };

export type Selection =
  | { kind: "new"; subject: string; subjectId: string | null }
  | { kind: "move"; id: string };

export type ToastMessage = { id: number; tone: "error" | "success"; text: string; actionLabel?: string };

export type Dictionaries = { subjects: BuilderSubject[]; lessonTypes: BuilderLessonType[] };

export type BoardEntry = ScheduleEntryItem & {
  subjectId: string | null;
  lessonType: string | null;
  subjectRef: BuilderSubjectRef | null;
};

export type PaletteBlock = {
  id: string;
  title: string;
  subjectId: string | null;
  color: string | null;
  teacherName: string | null;
  placedCount: number;
  lessonType: string;
  room: string | null;
};

export type LegoDragPayload =
  | {
      kind: "new";
      blockId: string;
      subject: string;
      subjectId: string | null;
      lessonType: string | null;
      room: string | null;
      teacher: string | null;
      color: string | null;
    }
  | { kind: "move"; id: string; subject: string };
