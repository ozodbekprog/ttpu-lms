export const EXAM_MIN_PERCENT = 80;

export const SESSION_TYPES = ["MIDTERM", "FINAL", "RETAKE"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SHEET_STATUSES = ["PENDING", "PASSED", "FAILED", "ABSENT"] as const;
export type SheetStatus = (typeof SHEET_STATUSES)[number];

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  MIDTERM: "Oraliq nazorat",
  FINAL: "Yakuniy imtihon",
  RETAKE: "Qayta topshirish",
};

export const SHEET_STATUS_LABEL: Record<SheetStatus, string> = {
  PENDING: "Kutilmoqda",
  PASSED: "O'tdi",
  FAILED: "O'tmadi",
  ABSENT: "Kelmagan",
};

export function sessionTypeLabel(type: string) {
  return SESSION_TYPE_LABEL[type as SessionType] ?? type;
}

export function sheetStatusLabel(status: string) {
  return SHEET_STATUS_LABEL[status as SheetStatus] ?? status;
}

export type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percent: number;
  eligible: boolean;
};

export type SessionCourseRef = { id: string; title: string; slug: string };

export type StaffSessionItem = {
  id: string;
  title: string;
  type: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  admissionOpen: boolean;
  termName: string | null;
  course: SessionCourseRef;
  sheetCount: number;
  eligibleCount: number;
  passedCount: number;
  failedCount: number;
  absentCount: number;
  pendingCount: number;
};

export type StudentSessionItem = {
  id: string;
  title: string;
  type: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  admissionOpen: boolean;
  course: SessionCourseRef;
  sheet: { id: string; seat: string | null; status: string; score: number | null } | null;
  attendance: AttendanceSummary;
};

export type SessionSheetRow = {
  studentId: string;
  studentName: string;
  studentGroup: string | null;
  sheetId: string | null;
  seat: string | null;
  status: string;
  score: number | null;
  attendance: AttendanceSummary;
  admitted: boolean;
};
