export type JournalStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type JournalStudent = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type JournalSummaryRow = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percent: number;
  eligible: boolean;
};

export type JournalDateTotal = {
  date: string;
  attended: number;
  total: number;
};

export type JournalData = {
  students: JournalStudent[];
  dates: string[];
  records: Record<string, Record<string, JournalStatus>>;
  summary: Record<string, JournalSummaryRow>;
  dateTotals: JournalDateTotal[];
};

export const JOURNAL_MIN_PERCENT = 80;

export const JOURNAL_STATUS_ORDER: JournalStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export const JOURNAL_STATUS_META: Record<
  JournalStatus,
  { short: string; label: string; chip: string }
> = {
  PRESENT: {
    short: "K",
    label: "Keldi",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  },
  ABSENT: {
    short: "Y",
    label: "Kelmadi",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80",
  },
  LATE: {
    short: "Kech",
    label: "Kechikdi",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  },
  EXCUSED: {
    short: "S",
    label: "Sababli",
    chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
  },
};

const WEEKDAY_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export function journalDateParts(iso: string) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return { label: `${day}.${month}`, weekday: WEEKDAY_SHORT[date.getUTCDay()] ?? "" };
}
