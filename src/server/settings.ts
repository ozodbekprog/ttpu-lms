import { prisma } from "@/lib/prisma";

export const MODULE_KEYS = [
  "chat",
  "certificates",
  "calendar",
  "catalog",
  "forum",
  "qr_attendance",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleFlags = Record<ModuleKey, boolean>;

export type ModuleMeta = { title: string; description: string };

export const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  chat: {
    title: "Xabarlar (chat)",
    description: "Talabalar va o'qituvchilar o'rtasidagi yozishmalar.",
  },
  certificates: {
    title: "Sertifikatlar",
    description: "Kurs yakunida sertifikat berish va yuklab olish.",
  },
  calendar: {
    title: "Kalendar",
    description: "Dars jadvali va muhim sanalarni kalendar ko'rinishida kuzatish.",
  },
  catalog: {
    title: "Kurs katalogi",
    description: "Barcha mavjud kurslarni katalog bo'ylab qidirish va ko'rish.",
  },
  forum: {
    title: "E'lonlar va forum",
    description: "Kurs e'lonlari, muhokama mavzulari va javoblar.",
  },
  qr_attendance: {
    title: "QR davomat",
    description: "QR kod orqali dars davomatini tez belgilash.",
  },
};

export const DEFAULT_MODULE_FLAGS: ModuleFlags = {
  chat: true,
  certificates: true,
  calendar: true,
  catalog: true,
  forum: true,
  qr_attendance: true,
};

const MODULES_SETTING_KEY = "modules";

function normalizeFlags(value: unknown): ModuleFlags {
  const flags = { ...DEFAULT_MODULE_FLAGS };
  if (typeof value !== "object" || value === null || Array.isArray(value)) return flags;
  const raw = value as Record<string, unknown>;
  for (const key of MODULE_KEYS) {
    const flag = raw[key];
    if (typeof flag === "boolean") flags[key] = flag;
  }
  return flags;
}

export async function getModuleFlags(): Promise<ModuleFlags> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: MODULES_SETTING_KEY } });
    if (!setting) return { ...DEFAULT_MODULE_FLAGS };
    return normalizeFlags(setting.value);
  } catch {
    return { ...DEFAULT_MODULE_FLAGS };
  }
}

export async function setModuleFlags(flags: ModuleFlags): Promise<ModuleFlags> {
  const normalized = normalizeFlags(flags);
  await prisma.appSetting.upsert({
    where: { key: MODULES_SETTING_KEY },
    create: { key: MODULES_SETTING_KEY, value: normalized },
    update: { value: normalized },
  });
  return normalized;
}

export async function isModuleEnabled(key: ModuleKey): Promise<boolean> {
  const flags = await getModuleFlags();
  return flags[key];
}
