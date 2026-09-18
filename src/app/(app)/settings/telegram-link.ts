import { readFile } from "node:fs/promises";
import path from "node:path";

export async function isTelegramLinked(email: string): Promise<boolean> {
  try {
    const raw = await readFile(path.join(process.cwd(), "bot", "data.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return false;
    const links = (parsed as Record<string, unknown>).links;
    if (typeof links !== "object" || links === null || Array.isArray(links)) return false;
    return Object.values(links).some((value) => value === email);
  } catch {
    return false;
  }
}
