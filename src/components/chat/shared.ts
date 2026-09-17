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

export function fmtListTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return fmtClock(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function previewText(conversation: ChatConversation, currentUserId: string) {
  if (!conversation.lastMessage) return "Hali xabar yo'q";
  const prefix = conversation.lastMessage.senderId === currentUserId ? "Siz: " : "";
  return `${prefix}${conversation.lastMessage.body}`;
}
