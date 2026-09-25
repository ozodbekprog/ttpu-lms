export type BugSuggestion = {
  title: string;
  hint: string;
};

const PATTERNS: { test: RegExp; title: string; hint: string }[] = [
  {
    test: /prisma|P20\d\d|database|ECONNREFUSED.*5432/i,
    title: "Ma'lumotlar bazasi",
    hint: "Baza ulanishini va migratsiyalar holatini tekshirish kerak",
  },
  {
    test: /failed to fetch|network|load failed|ECONNREFUSED|ETIMEDOUT/i,
    title: "Tarmoq aloqasi",
    hint: "Server ishlayaptimi va tarmoq uzilmaganini tekshirish kerak",
  },
  {
    test: /hydrat|text content does not match/i,
    title: "Sahifa renderi",
    hint: "Server va brauzer renderi mosligini tekshirish kerak",
  },
  {
    test: /csrf/i,
    title: "Xavfsizlik (CSRF)",
    hint: "CSRF token oqimini tekshirish kerak",
  },
  {
    test: /chunk|loading chunk|404/i,
    title: "Fayl yuklash",
    hint: "Build yangilanganini va brauzer keshini tekshirish kerak",
  },
  {
    test: /unauthorized|forbidden|401|403/i,
    title: "Ruxsat / sessiya",
    hint: "Sessiya muddati va foydalanuvchi ruxsatlarini tekshirish kerak",
  },
];

export function classifyBug(message: string, stack?: string | null): BugSuggestion {
  const text = `${message} ${stack ?? ""}`;
  for (const pattern of PATTERNS) {
    if (pattern.test.test(text)) {
      return { title: pattern.title, hint: pattern.hint };
    }
  }
  return { title: "Boshqa xatolik", hint: "Qo'lda tekshirish kerak" };
}

const FRIENDLY: Record<string, string> = {
  "Ma'lumotlar bazasi": "ma'lumotlar bilan ishlashda",
  "Tarmoq aloqasi": "tarmoq aloqasida",
  "Sahifa renderi": "sahifani ko'rsatishda",
  "Xavfsizlik (CSRF)": "xavfsizlik tekshiruvida",
  "Fayl yuklash": "sahifa qismlarini yuklashda",
  "Ruxsat / sessiya": "ruxsat tekshiruvida",
  "Boshqa xatolik": "sahifa ishlashida",
};

export function friendlyBugLine(message: string, stack?: string | null): string {
  const { title } = classifyBug(message, stack);
  return FRIENDLY[title] ?? "sahifa ishlashida";
}
