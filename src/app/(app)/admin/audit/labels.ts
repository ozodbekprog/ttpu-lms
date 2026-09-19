export type AuditBadgeTone =
  | "slate"
  | "brand"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "purple"
  | "gold";

const ACTION_META: Record<string, { label: string; tone: AuditBadgeTone }> = {
  "schedule.status": { label: "Jadval holati", tone: "amber" },
  "submission.grade": { label: "Baholash", tone: "green" },
  "admin.user.update": { label: "Foydalanuvchi", tone: "brand" },
  "admin.settings.update": { label: "Sozlamalar", tone: "purple" },
  "certificate.issue": { label: "Sertifikat", tone: "gold" },
  "order.update": { label: "Ariza", tone: "blue" },
};

export function auditActionLabel(action: string) {
  return ACTION_META[action]?.label ?? action;
}

export function auditActionTone(action: string): AuditBadgeTone {
  return ACTION_META[action]?.tone ?? "slate";
}
