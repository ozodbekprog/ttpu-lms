import type { Metadata } from "next";
import { getLocale } from "@/i18n";
import { buildAuthMetadata } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildAuthMetadata(locale, "authRegisterTitle", "authRegisterSubtitle");
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
