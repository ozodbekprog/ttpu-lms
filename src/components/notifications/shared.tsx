export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string | Date;
};

export type NotificationKind = "message" | "schedule" | "grade" | "course" | "exam" | "system";

const KIND_RULES: { kind: NotificationKind; pattern: RegExp }[] = [
  { kind: "message", pattern: /xabar|chat|suhbat|message/i },
  { kind: "schedule", pattern: /jadval|schedule|dars|para|lesson/i },
  { kind: "exam", pattern: /quiz|test|imtihon|exam|nazorat/i },
  {
    kind: "grade",
    pattern: /baho|grade|ball|bahol|topshiriq|assignment|vazifa|muddat|deadline/i,
  },
  { kind: "course", pattern: /kurs|course|material|fan|enroll|o'quv/i },
];

export function notificationKind(
  item: Pick<NotificationItem, "title" | "body" | "link">,
): NotificationKind {
  const haystack = [item.title, item.body ?? "", item.link ?? ""].join(" ");
  for (const rule of KIND_RULES) {
    if (rule.pattern.test(haystack)) return rule.kind;
  }
  return "system";
}

type NotificationStyle = {
  wrap: string;
  dot: string;
  label: string;
};

const KIND_STYLES: Record<NotificationKind, NotificationStyle> = {
  message: {
    wrap: "bg-brand-50 text-brand-700 ring-brand-100",
    dot: "bg-brand-900",
    label: "Xabar",
  },
  schedule: {
    wrap: "bg-sky-50 text-sky-600 ring-sky-100",
    dot: "bg-sky-500",
    label: "Jadval",
  },
  grade: {
    wrap: "bg-amber-50 text-amber-600 ring-amber-100",
    dot: "bg-amber-500",
    label: "Baho",
  },
  course: {
    wrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    dot: "bg-emerald-500",
    label: "Kurs",
  },
  exam: {
    wrap: "bg-purple-50 text-purple-600 ring-purple-100",
    dot: "bg-purple-500",
    label: "Test",
  },
  system: {
    wrap: "bg-slate-100 text-slate-500 ring-slate-200/70",
    dot: "bg-slate-400",
    label: "Tizim",
  },
};

export function notificationStyle(kind: NotificationKind) {
  return KIND_STYLES[kind];
}

export function NotificationIcon({ kind }: { kind: NotificationKind }) {
  if (kind === "message") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (kind === "schedule") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (kind === "grade") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M8.2 12.5 7 22l5-3 5 3-1.2-9.5" />
      </svg>
    );
  }
  if (kind === "course") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
        <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (kind === "exam") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
