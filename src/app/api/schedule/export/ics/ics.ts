import type { ScheduleEntry } from "@prisma/client";
import { SLOT_TIMES } from "@/components/attendance/lesson-utils";
import { isoWeekNumber, addDays } from "@/app/(app)/schedule/print/week";

const TIME_ZONE = "Asia/Tashkent";

const STATUS_LABELS: Record<ScheduleEntry["status"], string> = {
  NORMAL: "Rejadagi",
  CHANGED: "O'zgartirilgan",
  MOVED: "Ko'chirilgan",
  CANCELLED: "Bekor qilindi",
};

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function slotRange(slot: number) {
  const display = SLOT_TIMES[slot];
  if (!display) return null;
  const [start, end] = display.split("–");
  if (!start || !end) return null;
  return { start: start.trim(), end: end.trim() };
}

function localStamp(iso: string, time: string) {
  return `${iso.replace(/-/g, "")}T${time.replace(/:/g, "")}00`;
}

function startDate(entry: ScheduleEntry, monday: string) {
  const date = addDays(monday, entry.dayOfWeek - 1);
  if (entry.parity !== "odd" && entry.parity !== "even") return date;
  const oddWeek = isoWeekNumber(date) % 2 === 1;
  if (oddWeek === (entry.parity === "odd")) return date;
  return addDays(date, 7);
}

function eventLines(entry: ScheduleEntry, monday: string, stamp: string) {
  const range = slotRange(entry.slot);
  if (!range) return [];
  const date = startDate(entry, monday);
  const cancelled = entry.status === "CANCELLED";
  const summary = `${entry.room ? `${entry.subject} — ${entry.room}` : entry.subject}${
    cancelled ? " (Bekor qilindi)" : ""
  }`;
  const description = [
    ...(entry.teacher ? [`O'qituvchi: ${entry.teacher}`] : []),
    `Holat: ${STATUS_LABELS[entry.status]}`,
    ...(entry.note ? [`Izoh: ${entry.note}`] : []),
  ].join("\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${entry.id}@ttpu-lms`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TIME_ZONE}:${localStamp(date, range.start)}`,
    `DTEND;TZID=${TIME_ZONE}:${localStamp(date, range.end)}`,
    entry.parity === "odd" || entry.parity === "even"
      ? "RRULE:FREQ=WEEKLY;INTERVAL=2"
      : "RRULE:FREQ=WEEKLY",
    `SUMMARY:${escapeText(summary)}`,
  ];
  if (entry.room) lines.push(`LOCATION:${escapeText(entry.room)}`);
  lines.push(`DESCRIPTION:${escapeText(description)}`);
  lines.push(`STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`);
  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(
  group: { id: string; name: string },
  entries: ScheduleEntry[],
  monday: string,
) {
  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TTPU LMS//Dars jadvali//UZ",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(group.name)} — dars jadvali`,
    "X-WR-TIMEZONE:Asia/Tashkent",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Tashkent",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0500",
    "TZOFFSETTO:+0500",
    "TZNAME:+05",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  for (const entry of entries) lines.push(...eventLines(entry, monday, stamp));
  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
