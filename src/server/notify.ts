import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppUrl, sendMail } from "@/server/mailer";
import { normalizeUserPreferences } from "@/components/settings/preferences";

type NotifyInput = {
  title: string;
  body?: string;
  link?: string;
};

type NotifyTarget = {
  id: string;
  email: string;
  preferences: unknown;
};

const DEADLINE_PATTERN = /muddat|deadline|topshiriq|assignment|vazifa/i;

function isDeadlineNotice(input: NotifyInput): boolean {
  return DEADLINE_PATTERN.test([input.title, input.body ?? "", input.link ?? ""].join(" "));
}

function noticeText(input: NotifyInput): string {
  const lines = [input.title];
  if (input.body) lines.push("", input.body);
  if (input.link) lines.push("", `${getAppUrl()}${input.link}`);
  return lines.join("\n");
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function telegramChatIdsByEmail(): Promise<Map<string, string[]>> {
  try {
    const raw = await readFile(path.join(process.cwd(), "bot", "data.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return new Map();
    const links = (parsed as Record<string, unknown>).links;
    if (typeof links !== "object" || links === null || Array.isArray(links)) return new Map();
    const result = new Map<string, string[]>();
    for (const [chatId, email] of Object.entries(links)) {
      if (typeof email !== "string") continue;
      const chatIds = result.get(email) ?? [];
      chatIds.push(chatId);
      result.set(email, chatIds);
    }
    return result;
  } catch {
    return new Map();
  }
}

async function sendTelegram(chatIds: string[], text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await Promise.allSettled(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }),
    ),
  );
}

async function sendEmail(target: NotifyTarget, input: NotifyInput): Promise<void> {
  if (!smtpConfigured()) {
    console.log(`Email yuborilmadi (SMTP sozlanmagan): ${target.email}`);
    return;
  }
  try {
    await sendMail({ to: target.email, subject: input.title, text: noticeText(input) });
  } catch {
    console.log(`Email yuborilmadi: ${target.email}`);
  }
}

async function deliver(targets: NotifyTarget[], input: NotifyInput): Promise<void> {
  try {
    const deadline = isDeadlineNotice(input);
    const chatIdsByEmail = await telegramChatIdsByEmail();
    const text = noticeText(input);
    const jobs: Promise<void>[] = [];
    for (const target of targets) {
      const preferences = normalizeUserPreferences(target.preferences);
      const deadlineBlocked = deadline && !preferences.deadlineReminder;
      if (preferences.reminderBot && !deadlineBlocked) {
        const chatIds = chatIdsByEmail.get(target.email);
        if (chatIds && chatIds.length > 0) jobs.push(sendTelegram(chatIds, text));
      }
      if (preferences.emailNotify) jobs.push(sendEmail(target, input));
    }
    await Promise.allSettled(jobs);
  } catch {}
}

function scheduleDeliver(targets: NotifyTarget[], input: NotifyInput): void {
  try {
    after(() => deliver(targets, input));
  } catch {
    void deliver(targets, input);
  }
}

export async function notifyCourseStudents(courseId: string, input: NotifyInput) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { user: { select: { id: true, email: true, preferences: true } } },
    });
    if (enrollments.length === 0) return;

    const targets = enrollments.map((enrollment) => enrollment.user);
    await prisma.notification.createMany({
      data: targets.map((target) => ({
        userId: target.id,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })),
    });
    scheduleDeliver(targets, input);
  } catch {}
}

export async function notifyGroupStudents(groupId: string, input: NotifyInput) {
  try {
    const targets = await prisma.user.findMany({
      where: { groupId, role: "STUDENT" },
      select: { id: true, email: true, preferences: true },
    });
    if (targets.length === 0) return;

    await prisma.notification.createMany({
      data: targets.map((target) => ({
        userId: target.id,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })),
    });
    scheduleDeliver(targets, input);
  } catch {}
}

export async function notifyUser(userId: string, input: NotifyInput) {
  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, preferences: true },
    });
    if (!target) return;

    await prisma.notification.create({
      data: {
        userId: target.id,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
    scheduleDeliver([target], input);
  } catch {}
}
