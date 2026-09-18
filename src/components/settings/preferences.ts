export type UserPreferences = {
  reminderBot: boolean;
  reminderHour: number;
  deadlineReminder: boolean;
  showCharts: boolean;
  scheduleListView: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  reminderBot: true,
  reminderHour: 8,
  deadlineReminder: true,
  showCharts: true,
  scheduleListView: false,
};

export const REMINDER_HOURS = [7, 8, 9, 10] as const;

export function reminderHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function normalizeUserPreferences(value: unknown): UserPreferences {
  const preferences = { ...DEFAULT_USER_PREFERENCES };
  if (typeof value !== "object" || value === null || Array.isArray(value)) return preferences;
  const raw = value as Record<string, unknown>;
  if (typeof raw.reminderBot === "boolean") preferences.reminderBot = raw.reminderBot;
  if (
    typeof raw.reminderHour === "number" &&
    Number.isInteger(raw.reminderHour) &&
    raw.reminderHour >= 7 &&
    raw.reminderHour <= 10
  ) {
    preferences.reminderHour = raw.reminderHour;
  }
  if (typeof raw.deadlineReminder === "boolean") preferences.deadlineReminder = raw.deadlineReminder;
  if (typeof raw.showCharts === "boolean") preferences.showCharts = raw.showCharts;
  if (typeof raw.scheduleListView === "boolean") preferences.scheduleListView = raw.scheduleListView;
  return preferences;
}
