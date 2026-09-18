import type { ScheduleStatus } from "@/components/schedule/types";

export type BuilderGroup = { id: string; name: string };

export type BuilderCourse = { id: string; title: string; teacherName: string | null };

export type BuilderEntry = {
  id: string;
  groupId: string;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  parity: string | null;
  status: ScheduleStatus;
  note: string | null;
};

export type CellRef = { day: number; slot: number };

export type DragPayload =
  | { kind: "new"; subject: string }
  | { kind: "move"; id: string; subject: string };

export type Selection =
  | { kind: "new"; subject: string }
  | { kind: "move"; id: string };

export type ToastMessage = { id: number; tone: "error" | "success"; text: string };
