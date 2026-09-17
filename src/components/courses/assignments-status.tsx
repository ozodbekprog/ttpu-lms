import { Badge } from "@/components/ui";

export type SubmissionStatusValue = "SUBMITTED" | "GRADED" | "LATE";

const LABELS: Record<SubmissionStatusValue, string> = {
  SUBMITTED: "Topshirilgan",
  GRADED: "Baholangan",
  LATE: "Kechikkan",
};

const TONES: Record<SubmissionStatusValue, "blue" | "green" | "amber"> = {
  SUBMITTED: "blue",
  GRADED: "green",
  LATE: "amber",
};

export function submissionStatusLabel(status: SubmissionStatusValue | null | undefined) {
  return status ? LABELS[status] : "Topshirilmagan";
}

export function SubmissionBadge({
  status,
}: {
  status: SubmissionStatusValue | null | undefined;
}) {
  return <Badge tone={status ? TONES[status] : "slate"}>{submissionStatusLabel(status)}</Badge>;
}
