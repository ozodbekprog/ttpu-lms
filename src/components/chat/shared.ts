import { fmtDate } from "@/lib/utils";

export type ChatParticipant = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: "ADMIN" | "TEACHER" | "STUDENT";
};

export type ChatConversation = {
  id: string;
  participant: ChatParticipant;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export function roleLabel(role: ChatParticipant["role"]) {
  if (role === "ADMIN") return "Administrator";
  if (role === "TEACHER") return "O'qituvchi";
  return "Talaba";
}

export function fmtClock(value: string) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function dayDiff(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today.getTime() - target.getTime()) / 86400000);
}

export function dayKey(value: string) {
  return new Date(value).toDateString();
}

export function fmtDayLabel(value: string) {
  const diff = dayDiff(value);
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Kecha";
  return fmtDate(value);
}

export function fmtListTime(value: string) {
  const date = new Date(value);
  const diff = dayDiff(value);
  if (diff === 0) return fmtClock(value);
  if (diff === 1) return "Kecha";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function previewText(conversation: ChatConversation, currentUserId: string) {
  if (!conversation.lastMessage) return "Hali xabar yo'q";
  const prefix = conversation.lastMessage.senderId === currentUserId ? "Siz: " : "";
  return `${prefix}${conversation.lastMessage.body}`;
}
