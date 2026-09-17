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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path.join(ROOT_DIR, ".env"));
  }
} catch {}

let token = "";
let prisma = null;
let links = {};

function loadLinks() {
  if (!existsSync(DATA_FILE)) return {};
  try {
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

function saveLinks() {
  writeFileSync(DATA_FILE, `${JSON.stringify(links, null, 2)}\n`, "utf8");
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
  const head = time ? `${entry.slot}-par ${time}` : `${entry.slot}-par`;
  const parts = [head, entry.subject];
  if (entry.teacher) parts.push(entry.teacher);
  if (entry.room) parts.push(entry.room);
  return parts.join(" | ");
}

export function formatEntries(entries) {
  return entries.map((entry) => formatLesson(entry)).join("\n");
}

const HELP_TEXT = [
  "Buyruqlar:",
  "/start — boshlash va emailni bog'lash",
  "/jadval — bugungi darslar",
  "/ertaga — ertangi darslar",
  "/help — shu yordam",
  "",
  "Email manzilingizni yuborsangiz (masalan: ozodbek@ttpu.uz), jadval guruhingizga bog'lanadi.",
].join("\n");

function startText(name) {
  return [
    `Salom${name ? `, ${name}` : ""}! TTPU LMS jadval botiga xush kelibsiz.`,
    "",
    "Guruhingiz jadvalini olish uchun email manzilingizni yuboring (masalan: ozodbek@ttpu.uz).",
    "",
    HELP_TEXT,
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
  saveLinks();
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
    saveLinks();
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
  const header = `${label}, ${DAY_NAMES[dayOfWeek]} — ${user.group.name}`;

  if (dayOfWeek === 0) {
    await sendMessage(chatId, `${header}\nYakshanba — dam kuni, darslar yo'q.`);
    return;
  }

  const entries = await getPrisma().scheduleEntry.findMany({
    where: { groupId: user.groupId, dayOfWeek },
    orderBy: { slot: "asc" },
  });
  if (entries.length === 0) {
    await sendMessage(chatId, `${header}\nDarslar yo'q.`);
    return;
  }
  await sendMessage(chatId, `${header}\n\n${formatEntries(entries)}`);
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

  links = loadLinks();
  prisma = new PrismaClient();
  await prisma.$connect();
  console.log("Telegram bot ishga tushdi. To'xtatish: Ctrl+C");
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
