"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Button, EmptyState, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatParticipant } from "./shared";
import { fmtListTime, previewText, roleLabel } from "./shared";

type UsersResponse = { ok: boolean; data?: { users: ChatParticipant[] } };

type Props = {
  conversations: ChatConversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onStartConversation: (userId: string) => Promise<boolean>;
};

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onStartConversation,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatParticipant[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const requestRef = useRef(0);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function runSearch(value: string) {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const text = value.trim();
    if (!text) {
      requestRef.current += 1;
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    timerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/chat/users?q=${encodeURIComponent(text)}`, {
            cache: "no-store",
          });
          const json = (await res.json().catch(() => null)) as UsersResponse | null;
          if (requestRef.current !== requestId) return;
          if (res.ok && json?.ok && json.data) setResults(json.data.users);
        } catch {
          return;
        } finally {
          if (requestRef.current === requestId) setSearching(false);
        }
      })();
    }, 250);
  }

  function closePicker() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    requestRef.current += 1;
    setPickerOpen(false);
    setQuery("");
    setResults([]);
    setSearching(false);
    setPickerError(null);
  }

  async function pick(userId: string) {
    if (starting) return;
    setStarting(true);
    setPickerError(null);
    const ok = await onStartConversation(userId);
    setStarting(false);
    if (ok) {
      closePicker();
    } else {
      setPickerError("Suhbat ochilmadi. Qayta urinib ko'ring.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand-950">Suhbatlar</p>
          <Button
            size="sm"
            variant={pickerOpen ? "secondary" : "primary"}
            onClick={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Yangi suhbat
          </Button>
        </div>

        {pickerOpen ? (
          <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2">
            <Input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                runSearch(event.target.value);
              }}
              placeholder="Ism yoki email bo'yicha qidirish..."
            />
            {pickerError ? <p className="mt-2 px-1 text-xs text-rose-600">{pickerError}</p> : null}
            <div className="mt-2 max-h-56 overflow-y-auto">
              {query.trim().length === 0 ? (
                <p className="px-1 py-3 text-center text-xs text-slate-400">
                  Qidirish uchun ism yoki email yozing
                </p>
              ) : searching ? (
                <p className="px-1 py-3 text-center text-xs text-slate-400">Qidirilmoqda...</p>
              ) : results.length === 0 ? (
                <p className="px-1 py-3 text-center text-xs text-slate-400">Hech kim topilmadi</p>
              ) : (
                <ul className="space-y-1">
                  {results.map((person) => (
                    <li key={person.id}>
                      <button
                        type="button"
                        disabled={starting}
                        onClick={() => void pick(person.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-white disabled:opacity-60"
                      >
                        <Avatar name={person.name} src={person.avatarUrl} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {person.name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {roleLabel(person.role)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Suhbatlar yo'q"
              description="Yangi suhbat tugmasi orqali o'qituvchi yoki talaba bilan yozishmani boshlang."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              const unread = conversation.unreadCount > 0;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150",
                      active ? "bg-brand-50" : "hover:bg-slate-50",
                    )}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={conversation.participant.name} src={conversation.participant.avatarUrl} size={40} />
                      {unread ? (
                        <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand-900 px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-white">
                          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            unread ? "font-semibold text-brand-950" : "font-medium text-slate-800",
                          )}
                        >
                          {conversation.participant.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {conversation.lastMessage ? fmtListTime(conversation.lastMessage.createdAt) : ""}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-xs",
                          unread ? "font-medium text-slate-700" : "text-slate-500",
                        )}
                      >
                        {previewText(conversation, currentUserId)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
