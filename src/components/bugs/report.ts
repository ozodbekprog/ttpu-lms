export type IssueReport = {
  message: string;
  label?: string;
  note?: string;
  autoSend?: boolean;
};

export const BUG_ASSISTANT_EVENT = "bug-assistant:report";

export function reportIssue(detail: IssueReport): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BUG_ASSISTANT_EVENT, { detail }));
}
