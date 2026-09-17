import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type SubmissionStatusValue = "SUBMITTED" | "GRADED" | "LATE";

const LABELS: Record<SubmissionStatusValue, string> = {
  SUBMITTED: "Topshirilgan",
  GRADED: "Baholangan",
  LATE: "Kechikkan",
};

const TONES: Record<SubmissionStatusValue, "blue" | "green" | "rose"> = {
  SUBMITTED: "blue",
  GRADED: "green",
  LATE: "rose",
};

const DOTS: Record<SubmissionStatusValue, string> = {
  SUBMITTED: "bg-brand-500",
  GRADED: "bg-emerald-500",
  LATE: "bg-rose-500",
};

export function submissionStatusLabel(status: SubmissionStatusValue | null | undefined) {
  return status ? LABELS[status] : "Topshirilmagan";
}

export function SubmissionBadge({
  status,
}: {
  status: SubmissionStatusValue | null | undefined;
}) {
  return (
    <Badge tone={status ? TONES[status] : "slate"}>
      <span
        className={cn("mr-1.5 size-1.5 rounded-full", status ? DOTS[status] : "bg-slate-400")}
      />
      {submissionStatusLabel(status)}
    </Badge>
  );
}
