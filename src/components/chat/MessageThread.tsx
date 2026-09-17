"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Button, EmptyState, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage } from "./shared";
import { fmtClock, roleLabel } from "./shared";

type Props = {
  conversation: ChatConversation | null;
  currentUserId: string;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  onSend: (body: string) => Promise<boolean>;
  onBack: () => void;
};

export function MessageThread({
  conversation,
  currentUserId,
  messages,
  loading,
  sending,
  onSend,
  onBack,
}: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const conversationId = conversation?.id ?? null;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, conversationId]);

  async function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    const ok = await onSend(text);
    if (ok) {
      setDraft("");
      setError(null);
    } else {
      setError("Xabar yuborilmadi. Birozdan so'ng qayta urinib ko'ring.");
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  if (!conversation) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <EmptyState
          title="Suhbat tanlanmagan"
          description="Chapdagi ro'yxatdan suhbat tanlang yoki yangisini boshlang."
        />
      </div>
    );
  }

  const participant = conversation.participant;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Suhbatlar ro'yxatiga qaytish"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <Avatar name={participant.name} src={participant.avatarUrl} size={38} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-950">{participant.name}</p>
          <p className="text-xs text-slate-500">{roleLabel(participant.role)}</p>
        </div>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading && messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Yuklanmoqda...</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="Hali xabar yo'q"
              description="Birinchi xabarni yozib yozishmani boshlang."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const own = message.senderId === currentUserId;
              return (
                <div key={message.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 sm:max-w-[70%]",
                      own
                        ? "rounded-br-md bg-brand-900 text-white shadow-sm"
                        : "rounded-bl-md border border-slate-200/70 bg-white text-slate-800 shadow-sm",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.body}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px]",
                        own ? "text-brand-200" : "text-slate-400",
                      )}
                    >
                      {fmtClock(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        {error ? <p className="mb-2 px-1 text-xs text-rose-600">{error}</p> : null}
        <div className="flex items-end gap-2">
          <Textarea
            rows={1}
            value={draft}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Xabar yozing..."
            className="max-h-32 min-h-10 flex-1 resize-none"
          />
          <Button
            onClick={() => void submit()}
            disabled={sending || draft.trim().length === 0}
            className="shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Yuborish
          </Button>
        </div>
      </div>
    </div>
  );
}
