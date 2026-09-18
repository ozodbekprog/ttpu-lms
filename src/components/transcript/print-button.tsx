"use client";

import { Button } from "@/components/ui";

export function TranscriptPrintButton() {
  return <Button onClick={() => window.print()}>Chop etish</Button>;
}
