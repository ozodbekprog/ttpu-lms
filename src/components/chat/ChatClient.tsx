"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import type { ChatConversation, ChatMessage } from "./shared";

type ConversationsResponse = { ok: boolean; data?: { conversations: ChatConversation[] } };
type ConversationResponse = { ok: boolean; data?: { conversation: ChatConversation } };
type MessagesResponse = { ok: boolean; data?: { messages: ChatMessage[] } };
type MessageResponse = { ok: boolean; data?: { message: ChatMessage } };

const POLL_MS = 5000;

type Props = {
  currentUserId: string;
  initialUserId?: string;
};

export function ChatClient({ currentUserId, initialUserId }: Props) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageData, setMessageData] = useState<{
    conversationId: string;
    items: ChatMessage[];
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const openedInitial = useRef(false);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as ConversationsResponse | null;
      if (res.ok && json?.ok && json.data) setConversations(json.data.conversations);
    } catch {
      return;
    } finally {
      setLoaded(true);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as MessagesResponse | null;
        if (!res.ok || !json?.ok || !json.data) return;
        const incoming = json.data.messages;
        setMessageData((prev) => {
          if (prev && prev.conversationId === conversationId) {
            const lastPrev = prev.items[prev.items.length - 1]?.id;
            const lastIncoming = incoming[incoming.length - 1]?.id;
            if (prev.items.length === incoming.length && lastPrev === lastIncoming) return prev;
          }
          return { conversationId, items: incoming };
        });
        void refreshConversations();
      } catch {
        return;
      }
    },
    [refreshConversations],
  );

  useEffect(() => {
    void Promise.resolve().then(refreshConversations);
    const timer = setInterval(() => {
      void refreshConversations();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshConversations]);

  useEffect(() => {
    if (!activeId) return;
    void Promise.resolve().then(() => loadMessages(activeId));
    const timer = setInterval(() => {
      void loadMessages(activeId);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [activeId, loadMessages]);

  const openConversation = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const json = (await res.json().catch(() => null)) as ConversationResponse | null;
        if (!res.ok || !json?.ok || !json.data) return false;
        const conversation = json.data.conversation;
        setConversations((prev) =>
          prev.some((item) => item.id === conversation.id) ? prev : [conversation, ...prev],
        );
        setActiveId(conversation.id);
        void refreshConversations();
        return true;
      } catch {
        return false;
      }
    },
    [refreshConversations],
  );

  useEffect(() => {
    if (!initialUserId || openedInitial.current) return;
    openedInitial.current = true;
    void openConversation(initialUserId);
  }, [initialUserId, openConversation]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeId) return false;
      setSending(true);
      try {
        const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const json = (await res.json().catch(() => null)) as MessageResponse | null;
        const message = json?.data?.message;
        if (!res.ok || !json?.ok || !message) return false;
        setMessageData((prev) =>
          prev && prev.conversationId === activeId
            ? { conversationId: activeId, items: [...prev.items, message] }
            : { conversationId: activeId, items: [message] },
        );
        void refreshConversations();
        return true;
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeId, refreshConversations],
  );

  const activeConversation = conversations.find((item) => item.id === activeId) ?? null;
  const messages =
    messageData && messageData.conversationId === activeId ? messageData.items : [];
  const loadingMessages = activeId !== null && messageData?.conversationId !== activeId;

  return (
    <Card className="flex h-[calc(100vh-15rem)] min-h-[480px] animate-fade-up overflow-hidden">
      <div
        className={cn(
          "w-full flex-col border-slate-100 md:flex md:w-80 md:border-r lg:w-96",
          activeId ? "hidden" : "flex",
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          currentUserId={currentUserId}
          loading={!loaded}
          onSelect={setActiveId}
          onStartConversation={openConversation}
        />
      </div>
      <div className={cn("min-w-0 flex-1", activeId ? "flex" : "hidden md:flex")}>
        <MessageThread
          key={activeId ?? "empty"}
          conversation={activeConversation}
          currentUserId={currentUserId}
          messages={messages}
          loading={loadingMessages}
          sending={sending}
          onSend={sendMessage}
          onBack={() => setActiveId(null)}
        />
      </div>
    </Card>
  );
}
