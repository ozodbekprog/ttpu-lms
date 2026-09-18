export type ScheduleStatus = "NORMAL" | "CHANGED" | "MOVED" | "CANCELLED";

export type ScheduleEntryItem = {
  id: string;
  groupId: string;
  groupName: string;
  dayOfWeek: number;
  slot: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  parity: string | null;
  status: ScheduleStatus;
  note: string | null;
};
