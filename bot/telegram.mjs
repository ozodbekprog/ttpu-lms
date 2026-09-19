import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const BOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(BOT_DIR, "..");
const DATA_FILE = path.join(BOT_DIR, "data.json");
const POLL_TIMEOUT = 30;
const RETRY_DELAY_MS = 5000;

const SLOT_TIMES = {
  1: "09:00–10:20",
  2: "10:30–11:50",
  3: "12:00–13:20",
  4: "14:20–15:40",
  5: "15:50–17:10",
  6: "17:20–18:40",
  7: "18:50–20:10",
  8: "20:20–21:40",
};

const DAY_NAMES = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const DAY_TITLES = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const SEPARATOR = "━━━━━━━━━━━━━━━━━━";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.join(ROOT_DIR, ".env"));
  }
} catch {}

let token = "";
let prisma = null;
let links = {};
let lastReminderDate = "";

function loadData() {
  if (!existsSync(DATA_FILE)) return;
  try {
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
    if (parsed.links && typeof parsed.links === "object" && !Array.isArray(parsed.links)) {
      links = parsed.links;
      lastReminderDate = typeof parsed.lastReminderDate === "string" ? parsed.lastReminderDate : "";
      return;
    }
    links = parsed;
  } catch {}
}

function saveData() {
  const payload = { links, lastReminderDate };
  writeFileSync(DATA_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

async function callApi(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!body.ok) {
    throw new Error(`Telegram ${method}: ${body.description ?? response.status}`);
  }
  return body.result;
}

async function sendMessage(chatId, text) {
  await callApi("sendMessage", { chat_id: chatId, text });
}

export function slotTime(slot) {
  return SLOT_TIMES[slot] ?? "";
}

export function formatLesson(entry) {
  const time = SLOT_TIMES[entry.slot];
  const head = `🕘 ${entry.slot}-par${time ? ` ${time}` : ""}`;
  const parts = [head, `📚 ${entry.subject}`];
  if (entry.room) parts.push(`🚪 ${entry.room}`);
  if (entry.teacher) parts.push(`👨‍🏫 ${entry.teacher}`);
  return parts.join(" | ");
}

export function formatEntries(entries) {
  return entries
    .map((entry) => {
      const lines = [formatLesson(entry)];
      const label = STATUS_LABELS[entry.status] ?? "";
      if (label) lines.push(label);
      return lines.join("\n");
    })
    .join("\n\n");
}

const STATUS_LABELS = {
  NORMAL: "",
  CHANGED: "🔄 O'zgartirilgan",
  MOVED: "➡️ Ko'chirilgan",
  CANCELLED: "❌ Bekor qilindi",
};

export function formatWeekLesson(entry) {
  const lines = [`• ${formatLesson(entry)}`];
  const label = STATUS_LABELS[entry.status] ?? "";
  if (label) lines.push(`   ${label}`);
  return lines.join("\n");
}

function mondayDate(date) {
  const copy = new Date(date);
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function shortDate(date) {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}`;
}

function weekRange(date) {
  const monday = mondayDate(date);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return `${shortDate(monday)} – ${shortDate(saturday)}.${saturday.getFullYear()}`;
}

export function weekText(groupName, entries, today) {
  const lines = [`📅 Haftalik jadval — ${groupName}`, `🗓 ${weekRange(new Date())}`, SEPARATOR, ""];
  if (entries.length === 0) {
    lines.push("📭 Bu hafta darslar yo'q.");
    return lines.join("\n");
  }
  for (let day = 1; day <= 6; day += 1) {
    const dayEntries = entries.filter((entry) => entry.dayOfWeek === day);
    if (dayEntries.length === 0) continue;
    lines.push(`📌 ${DAY_TITLES[day]}${day === today ? " (bugun)" : ""}`);
    for (const entry of dayEntries) lines.push(formatWeekLesson(entry));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

const APP_BASE_URL = "http://localhost:3000";

export function normalizeTeacher(name) {
  return name.replace(/\./g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchCourseSlug(subject, courses) {
  const subjectTokens = new Set(normalizeTitle(subject).split(" "));
  let bestSlug = null;
  let bestScore = 0;
  for (const course of courses) {
    const score = normalizeTitle(course.title)
      .split(" ")
      .filter((token) => token.length >= 3 && subjectTokens.has(token)).length;
    if (score > bestScore) {
      bestScore = score;
      bestSlug = course.slug;
    }
  }
  return bestScore > 0 ? bestSlug : null;
}

function attendanceUrl(slug, date, slot) {
  return `${APP_BASE_URL}/courses/${slug}/attendance/lesson?date=${date}&slot=${slot}`;
}

const REMINDER_HOUR = 8;
const REMINDER_CHECK_MS = 60 * 60 * 1000;
const EXAM_WINDOW_DAYS = 30;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function timeText(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

async function collectReminder(user, dayStart) {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const db = getPrisma();

  const courses = await db.course.findMany({
    where:
      user.role === "STUDENT"
        ? { enrollments: { some: { userId: user.id } } }
        : user.role === "TEACHER"
          ? { teacherId: user.id }
          : {},
    select: { id: true },
  });
  const courseIds = courses.map((course) => course.id);

  const lessons = user.groupId
    ? await db.scheduleEntry.findMany({
        where: { groupId: user.groupId, dayOfWeek: dayStart.getDay() },
        orderBy: { slot: "asc" },
      })
    : [];

  if (courseIds.length === 0) return { lessons, deadlines: [], exams: [] };

  const [assignments, quizzes, exams] = await Promise.all([
    db.assignment.findMany({
      where: { courseId: { in: courseIds }, dueAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { dueAt: "asc" },
      include: { course: { select: { title: true } } },
    }),
    db.quiz.findMany({
      where: {
        courseId: { in: courseIds },
        dueAt: { gte: dayStart, lt: dayEnd },
        ...(user.role === "STUDENT" ? { isPublished: true } : {}),
      },
      orderBy: { dueAt: "asc" },
      include: { course: { select: { title: true } } },
    }),
    db.examSession.findMany({
      where: { courseId: { in: courseIds }, date: { gte: dayStart, lt: dayEnd } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        course: { select: { title: true } },
        sheets: { select: { status: true, score: true } },
      },
    }),
  ]);

  const deadlines = [
    ...assignments.map((assignment) => ({
      dueAt: assignment.dueAt,
      text: `Topshiriq: ${assignment.title} — ${assignment.course.title}`,
    })),
    ...quizzes.map((quiz) => ({
      dueAt: quiz.dueAt,
      text: `Test: ${quiz.title} — ${quiz.course.title}`,
    })),
  ]
    .filter((item) => item.dueAt !== null)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  return { lessons, deadlines, exams };
}

async function collectTeacherLessons(user, dayOfWeek) {
  const db = getPrisma();
  const entries = await db.scheduleEntry.findMany({
    where: { dayOfWeek },
    include: { group: { select: { name: true } } },
    orderBy: { slot: "asc" },
  });
  const own = entries.filter(
    (entry) => entry.teacher && normalizeTeacher(entry.teacher) === normalizeTeacher(user.name),
  );
  if (own.length === 0) return [];
  const courses = await db.course.findMany({
    where: { teacherId: user.id },
    select: { title: true, slug: true },
  });
  return own.map((entry) => ({
    entry,
    groupName: entry.group?.name ?? "",
    slug: matchCourseSlug(entry.subject, courses),
  }));
}

function teacherLessonText(item, date) {
  const time = SLOT_TIMES[item.entry.slot];
  const head = `🕘 ${item.entry.slot}-par${time ? ` ${time}` : ""}`;
  const parts = [head, `📚 ${item.entry.subject}`];
  if (item.entry.room) parts.push(`🚪 ${item.entry.room}`);
  if (item.groupName) parts.push(`👥 ${item.groupName}`);
  const lines = [`• ${parts.join(" | ")}`];
  if (item.slug) lines.push(`  🔗 ${attendanceUrl(item.slug, date, item.entry.slot)}`);
  return lines.join("\n");
}

export function examTime(session) {
  if (!session.startTime) return "";
  return session.endTime ? `${session.startTime}–${session.endTime}` : session.startTime;
}

export function examPermission(sheet) {
  if (!sheet) return "❌ Ruxsat yo'q";
  return sheet.status === "FAILED" || sheet.status === "ABSENT" ? "❌ Ruxsat yo'q" : "✅ Ruxsat";
}

export function formatExamSession(session) {
  const date = session.date;
  const time = examTime(session);
  const head = `🗓 ${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} (${DAY_TITLES[date.getDay()]})${time ? ` | 🕘 ${time}` : ""}`;
  const lines = [head, `📚 ${session.course.title} — ${session.title}`];
  const sheet = session.sheets?.[0] ?? null;
  const info = [];
  if (session.room) info.push(`🚪 Xona: ${session.room}`);
  if (sheet?.seat) info.push(`🎫 O'rindiq: ${sheet.seat}`);
  if (info.length > 0) lines.push(info.join(" | "));
  lines.push(examPermission(sheet));
  return lines.join("\n");
}

export function examsText(sessions) {
  if (sessions.length === 0) return "Kelayotgan imtihonlar yo'q";
  const lines = ["📝 Kelayotgan imtihonlar", SEPARATOR, ""];
  for (const session of sessions) {
    lines.push(formatExamSession(session));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function examReminderText(session) {
  const meta = [session.room, examTime(session)].filter(Boolean).join(", ");
  return `📝 Bugun imtihon: ${session.course.title} — ${session.title}${meta ? ` (${meta})` : ""}`;
}

function gradedSheetCount(sheets) {
  return sheets.filter((sheet) => sheet.score !== null || sheet.status !== "PENDING").length;
}

export function teacherExamText(session) {
  const lines = [`• 📝 ${session.course.title} — ${session.title}`];
  const meta = [];
  if (session.room) meta.push(`🚪 ${session.room}`);
  const time = examTime(session);
  if (time) meta.push(`🕘 ${time}`);
  if (meta.length > 0) lines.push(`   ${meta.join(" | ")}`);
  lines.push(`   🗂 ${session.sheets.length} varaq, ${gradedSheetCount(session.sheets)} natija kiritilgan`);
  return lines.join("\n");
}

export function reminderText(user, day, lessons, deadlines, teacherLessons = [], exams = []) {
  const lines = [`🌟 Eslatma — bugun, ${DAY_NAMES[day.getDay()]}, ${dateKey(day)}`];
  if (user.group) lines.push(`👥 Guruh: ${user.group.name}`);
  lines.push(SEPARATOR, "");
  lines.push("📌 Darslar:");
  if (user.role === "TEACHER" && teacherLessons.length > 0) {
    for (const item of teacherLessons) {
      lines.push(teacherLessonText(item, dateKey(day)));
      lines.push("");
    }
    lines.push("⏰ Davomatni belgilashni unutmang.");
    const first = teacherLessons.find((item) => item.slug);
    if (first) {
      lines.push(`🔗 Birinchi dars havolasi: ${attendanceUrl(first.slug, dateKey(day), first.entry.slot)}`);
    }
  } else {
    lines.push(lessons.length > 0 ? formatEntries(lessons) : "📭 Bugun darslar yo'q.");
  }
  if (exams.length > 0) {
    lines.push("");
    if (user.role === "TEACHER") {
      lines.push("📝 Bugungi imtihonlar:");
      for (const exam of exams) lines.push(teacherExamText(exam));
    } else {
      for (const exam of exams) lines.push(examReminderText(exam));
    }
  }
  lines.push("");
  lines.push("⏰ Bugungi muddatlar:");
  if (deadlines.length === 0) {
    lines.push("📌 Bugun deadline yo'q.");
  } else {
    for (const item of deadlines) lines.push(`• 📌 ${item.text} (${timeText(item.dueAt)})`);
  }
  return lines.join("\n");
}

async function sendDailyReminders() {
  const now = new Date();
  if (now.getHours() !== REMINDER_HOUR) return;
  const today = dateKey(now);
  if (lastReminderDate === today) return;

  const dayStart = startOfDay(now);
  for (const [chatId, email] of Object.entries(links)) {
    if (typeof email !== "string") continue;
    try {
      const user = await getPrisma().user.findUnique({
        where: { email },
        include: { group: true },
      });
      if (!user) continue;
      const { lessons, deadlines, exams } = await collectReminder(user, dayStart);
      const teacherLessons =
        user.role === "TEACHER" ? await collectTeacherLessons(user, now.getDay()) : [];
      await sendMessage(chatId, reminderText(user, now, lessons, deadlines, teacherLessons, exams));
    } catch (error) {
      console.error(`Eslatma yuborilmadi (${chatId}):`, errorText(error));
    }
  }

  lastReminderDate = today;
  saveData();
}

function startReminderLoop() {
  const run = () => {
    void sendDailyReminders().catch((error) =>
      console.error("Eslatma tekshiruvi xatosi:", errorText(error)),
    );
  };
  run();
  setInterval(run, REMINDER_CHECK_MS);
}

const HELP_TEXT = [
  "📋 Buyruqlar:",
  "• /start — boshlash va emailni bog'lash",
  "• /jadval — bugungi darslar",
  "• /ertaga — ertangi darslar",
  "• /hafta — haftalik jadval (kun-kun)",
  "• /davomat — o'qituvchilar uchun bugungi darslar va davomat havolalari",
  "• /imtihon — kelayotgan imtihonlar (30 kun)",
  "• /help — shu yordam",
  "",
  "📧 Email manzilingizni yuborsangiz (masalan: ozodbek@ttpu.uz), jadval guruhingizga bog'lanadi.",
].join("\n");

function startText(name) {
  return [
    `👋 Salom${name ? `, ${name}` : ""}! Men TTPU LMS jadval botiman.`,
    "📚 Guruh jadvali, haftalik darslar va o'qituvchilar uchun davomat — hammasi shu yerda.",
    "",
    "Nimalar qila olaman:",
    "• /jadval — bugungi darslar",
    "• /ertaga — ertangi darslar",
    "• /hafta — haftalik jadval",
    "• /davomat — o'qituvchilar uchun davomat havolalari",
    "• /help — yordam",
    "",
    "📧 Boshlash uchun email manzilingizni yuboring (masalan: ozodbek@ttpu.uz).",
  ].join("\n");
}

function parseCommand(text) {
  const first = text.trim().split(/\s+/)[0];
  if (!first.startsWith("/")) return null;
  return first.slice(1).split("@")[0].toLowerCase();
}

async function linkEmail(chatId, email) {
  const user = await getPrisma().user.findUnique({ where: { email }, include: { group: true } });
  if (!user) {
    await sendMessage(chatId, `"${email}" bazada topilmadi. Emailni tekshirib, qayta yuboring.`);
    return;
  }
  links[String(chatId)] = user.email;
  saveData();
  const groupLine = user.group
    ? `Guruh: ${user.group.name}.`
    : "Sizga guruh biriktirilmagan, /jadval ishlamaydi.";
  await sendMessage(
    chatId,
    `Saqlandi: ${user.name} (${user.email}).\n${groupLine}\n\nEndi /jadval bilan bugungi darslarni ko'ring.`,
  );
}

async function sendSchedule(chatId, dayOffset) {
  const email = links[String(chatId)];
  if (!email) {
    await sendMessage(chatId, "Avval email manzilingizni yuboring (masalan: ozodbek@ttpu.uz).");
    return;
  }
  const user = await getPrisma().user.findUnique({ where: { email }, include: { group: true } });
  if (!user) {
    delete links[String(chatId)];
    saveData();
    await sendMessage(chatId, "Bog'langan foydalanuvchi bazadan topilmadi. Emailni qayta yuboring.");
    return;
  }
  if (!user.group) {
    await sendMessage(chatId, "Sizga guruh biriktirilmagan, jadval mavjud emas.");
    return;
  }

  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  const dayOfWeek = target.getDay();
  const label = dayOffset === 0 ? "Bugun" : "Ertaga";
  const header = `📅 ${label} — ${DAY_TITLES[dayOfWeek]}, ${dateKey(target)}\n👥 Guruh: ${user.group.name}`;

  if (dayOfWeek === 0) {
    await sendMessage(chatId, `${header}\n\n🎉 Dam kuni — darslar yo'q.`);
    return;
  }

  const entries = await getPrisma().scheduleEntry.findMany({
    where: { groupId: user.groupId, dayOfWeek },
    orderBy: { slot: "asc" },
  });
  if (entries.length === 0) {
    await sendMessage(chatId, `${header}\n\n📭 Darslar yo'q.`);
    return;
  }
  await sendMessage(chatId, `${header}\n${SEPARATOR}\n\n${formatEntries(entries)}`);
}

async function sendWeek(chatId) {
  const email = links[String(chatId)];
  if (!email) {
    await sendMessage(chatId, "Avval email manzilingizni yuboring (masalan: ozodbek@ttpu.uz).");
    return;
  }
  const user = await getPrisma().user.findUnique({ where: { email }, include: { group: true } });
  if (!user) {
    delete links[String(chatId)];
    saveData();
    await sendMessage(chatId, "Bog'langan foydalanuvchi bazadan topilmadi. Emailni qayta yuboring.");
    return;
  }
  if (!user.group) {
    await sendMessage(chatId, "Sizga guruh biriktirilmagan, jadval mavjud emas.");
    return;
  }

  const entries = await getPrisma().scheduleEntry.findMany({
    where: { groupId: user.groupId, dayOfWeek: { gte: 1, lte: 6 } },
    orderBy: [{ dayOfWeek: "asc" }, { slot: "asc" }],
  });
  await sendMessage(chatId, weekText(user.group.name, entries, new Date().getDay()));
}

async function sendAttendance(chatId) {
  const email = links[String(chatId)];
  if (!email) {
    await sendMessage(chatId, "Avval email manzilingizni yuboring (masalan: ozodbek@ttpu.uz).");
    return;
  }
  const user = await getPrisma().user.findUnique({ where: { email }, include: { group: true } });
  if (!user) {
    delete links[String(chatId)];
    saveData();
    await sendMessage(chatId, "Bog'langan foydalanuvchi bazadan topilmadi. Emailni qayta yuboring.");
    return;
  }
  if (user.role !== "TEACHER") {
    await sendMessage(chatId, "ℹ️ Bu buyruq o'qituvchilar uchun. Bugungi jadvalingiz:");
    await sendSchedule(chatId, 0);
    return;
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const date = dateKey(today);
  const header = `🔔 Davomat — bugun, ${DAY_NAMES[dayOfWeek]}, ${date}`;
  const items = await collectTeacherLessons(user, dayOfWeek);
  if (items.length === 0) {
    await sendMessage(chatId, `${header}\n\n📭 Bugun darslaringiz yo'q.`);
    return;
  }
  const lines = [header, SEPARATOR, ""];
  for (const item of items) {
    lines.push(teacherLessonText(item, date));
    lines.push("");
  }
  lines.push("⏰ Davomatni belgilashni unutmang!");
  await sendMessage(chatId, lines.join("\n"));
}

async function sendExams(chatId) {
  const email = links[String(chatId)];
  if (!email) {
    await sendMessage(chatId, "Avval email manzilingizni yuboring (masalan: ozodbek@ttpu.uz).");
    return;
  }
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user) {
    delete links[String(chatId)];
    saveData();
    await sendMessage(chatId, "Bog'langan foydalanuvchi bazadan topilmadi. Emailni qayta yuboring.");
    return;
  }

  const from = startOfDay(new Date());
  const until = new Date(from);
  until.setDate(until.getDate() + EXAM_WINDOW_DAYS);
  until.setHours(23, 59, 59, 999);

  const sessions = await getPrisma().examSession.findMany({
    where: {
      date: { gte: from, lte: until },
      course: { enrollments: { some: { userId: user.id } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      course: { select: { title: true } },
      sheets: { where: { studentId: user.id }, select: { seat: true, status: true } },
    },
  });
  await sendMessage(chatId, examsText(sessions));
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  if (!text) return;
  const command = parseCommand(text);

  if (command === "start") {
    await sendMessage(chatId, startText(message.from?.first_name ?? ""));
    return;
  }
  if (command === "help") {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }
  if (command === "jadval") {
    await sendSchedule(chatId, 0);
    return;
  }
  if (command === "ertaga") {
    await sendSchedule(chatId, 1);
    return;
  }
  if (command === "hafta") {
    await sendWeek(chatId);
    return;
  }
  if (command === "davomat") {
    await sendAttendance(chatId);
    return;
  }
  if (command === "imtihon") {
    await sendExams(chatId);
    return;
  }
  if (command) {
    await sendMessage(chatId, `Noma'lum buyruq: /${command}.\n\n${HELP_TEXT}`);
    return;
  }
  if (EMAIL_RE.test(text)) {
    await linkEmail(chatId, text.toLowerCase());
    return;
  }
  await sendMessage(chatId, "Tushunmadim. Email manzilingizni yuboring yoki /help ni ko'ring.");
}

async function poll() {
  let offset = 0;
  try {
    const last = await callApi("getUpdates", { offset: -1, timeout: 0 });
    if (last.length > 0) offset = last[last.length - 1].update_id + 1;
  } catch (error) {
    console.error("Boshlang'ich offset olinmadi:", errorText(error));
  }

  for (;;) {
    try {
      const updates = await callApi("getUpdates", {
        offset,
        timeout: POLL_TIMEOUT,
        allowed_updates: ["message"],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        if (!update.message) continue;
        try {
          await handleMessage(update.message);
        } catch (error) {
          console.error("Xabarni qayta ishlashda xato:", errorText(error));
        }
      }
    } catch (error) {
      console.error(`Polling xatosi: ${errorText(error)}. ${RETRY_DELAY_MS / 1000}s kutib qayta urinaman.`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function main() {
  token = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  if (!token) {
    console.error("Xato: TELEGRAM_BOT_TOKEN topilmadi.");
    console.error("Tokenni loyiha ildizidagi .env fayliga qo'shing yoki quyidagicha ishga tushiring:");
    console.error("  TELEGRAM_BOT_TOKEN=<token> node bot/telegram.mjs");
    process.exit(1);
  }
  loadData();

  prisma = new PrismaClient();
  await prisma.$connect();
  console.log("Telegram bot ishga tushdi. To'xtatish: Ctrl+C");
  startReminderLoop();
  await poll();
}

const isMain = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMain) {
  main().catch((error) => {
    console.error("Bot to'xtadi:", errorText(error));
    process.exit(1);
  });
}
