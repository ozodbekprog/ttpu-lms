"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar, Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatParticipant } from "./shared";
import { fmtListTime, previewText, roleLabel } from "./shared";

type UsersResponse = { ok: boolean; data?: { users: ChatParticipant[] } };

type Props = {
  conversations: ChatConversation[];
  activeId: string | null;
  currentUserId: string;
  loading?: boolean;
  onSelect: (id: string) => void;
  onStartConversation: (userId: string) => Promise<boolean>;
};

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  loading = false,
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

  const closePicker = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    requestRef.current += 1;
    setPickerOpen(false);
    setQuery("");
    setResults([]);
    setSearching(false);
    setPickerError(null);
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePicker();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen, closePicker]);

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
      <div className="border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-brand-950">Suhbatlar</p>
            {conversations.length > 0 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {conversations.length}
              </span>
            ) : null}
          </div>
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Yangi suhbat
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <ul className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-11 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </li>
            ))}
          </ul>
        ) : conversations.length === 0 ? (
          <div className="animate-fade-up p-4">
            <EmptyState
              title="Suhbatlar yo'q"
              description="Yangi suhbat tugmasi orqali o'qituvchi yoki talaba bilan yozishmani boshlang."
              action={
                <Button size="sm" onClick={() => setPickerOpen(true)}>
                  Yangi suhbat
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {conversations.map((conversation, index) => {
              const active = conversation.id === activeId;
              const unread = conversation.unreadCount > 0;
              return (
                <li
                  key={conversation.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150",
                      active ? "bg-brand-50/80" : "hover:bg-slate-50",
                    )}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand-900" />
                    ) : null}
                    <Avatar name={conversation.participant.name} src={conversation.participant.avatarUrl} size={44} />
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
                        <span className={cn("shrink-0 text-[11px]", unread ? "font-medium text-brand-700" : "text-slate-400")}>
                          {conversation.lastMessage ? fmtListTime(conversation.lastMessage.createdAt) : ""}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-xs",
                            unread ? "font-medium text-slate-700" : "text-slate-500",
                          )}
                        >
                          {previewText(conversation, currentUserId)}
                        </span>
                        {unread ? (
                          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[10px] font-semibold text-white">
                            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pickerOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
              <div
                className="absolute inset-0 bg-brand-950/45 backdrop-blur-sm"
                onClick={closePicker}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Yangi suhbat"
                className="animate-fade-up relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-lift"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-base font-semibold text-brand-950">Yangi suhbat</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      O&apos;qituvchi yoki talabani tanlang
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closePicker}
                    aria-label="Yopish"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-5 py-4">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      runSearch(event.target.value);
                    }}
                    placeholder="Ism yoki email bo'yicha qidirish..."
                  />
                  {pickerError ? (
                    <p className="mt-2 px-1 text-xs text-rose-600">{pickerError}</p>
                  ) : null}
                  <div className="mt-3 max-h-72 overflow-y-auto">
                    {query.trim().length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                          </svg>
                        </span>
                        <p className="text-xs text-slate-400">Qidirish uchun ism yoki email yozing</p>
                      </div>
                    ) : searching ? (
                      <ul className="space-y-1">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <li key={index} className="flex items-center gap-3 px-2 py-2">
                            <Skeleton className="size-10 shrink-0 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-3.5 w-2/5" />
                              <Skeleton className="h-3 w-1/4" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : results.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </span>
                        <p className="text-xs text-slate-400">Hech kim topilmadi</p>
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {results.map((person, index) => (
                          <li
                            key={person.id}
                            className="animate-fade-up"
                            style={{ animationDelay: `${Math.min(index, 6) * 30}ms` }}
                          >
                            <button
                              type="button"
                              disabled={starting}
                              onClick={() => void pick(person.id)}
                              className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2 text-left transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                            >
                              <Avatar name={person.name} src={person.avatarUrl} size={40} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-slate-800">
                                  {person.name}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  {roleLabel(person.role)}
                                </span>
                              </span>
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
