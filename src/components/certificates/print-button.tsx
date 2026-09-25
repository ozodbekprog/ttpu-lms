"use client";

import { Button } from "@/components/ui";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function PrintButton() {
  const { t } = useI18n();
  return (
    <Button onClick={() => window.print()}>
      {t("certPrintButton")}
    </Button>
  );
}
