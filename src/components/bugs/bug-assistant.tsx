"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { friendlyBugLine } from "./bug-utils";
import { BUG_ASSISTANT_EVENT } from "./report";

type ChatMessage = { role: "ai" | "user"; text: string; time: string };
type Captured = { message: string; stack?: string; url: string };

function fmtClock(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const GREETING =
  "Salom! 😊 Men AI yordamchiman. TTPU LMS saytida qanday yordam bera olaman? Muammo yoki savolingizni yozing — birgalikda hal qilamiz.";

export function BugAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const captured = useRef<Captured | null>(null);
  const lastAutoAt = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const aiSay = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "ai", text, time: fmtClock(new Date()) }]);
  }, []);

  const askAiReply = useCallback(
    async (pending: ChatMessage[]): Promise<string> => {
      try {
        const res = await apiFetch("/api/assistant/chat", {
          method: "POST",
          body: JSON.stringify({
            messages: pending.slice(-8).map((message) => ({
              role: message.role === "ai" ? "assistant" : "user",
              content: message.text,
            })),
            context: captured.current
              ? { url: captured.current.url, errorMessage: captured.current.message }
              : undefined,
          }),
        });
        const json = (await res.json().catch(() => null)) as
          | {
              ok?: boolean;
              data?: {
                reply?: string;
                actions?: { type?: string; path?: string; title?: string }[];
              };
            }
          | null;
        const actions = json?.data?.actions ?? [];
        const nav = actions.find(
          (action) => action.type === "navigate" && typeof action.path === "string" && action.path,
        );
        if (nav?.path) {
          const target = nav.path;
          router.push(target);
          window.setTimeout(() => {
            if (window.location.pathname !== target) {
              window.location.assign(target);
            }
          }, 700);
        }
        const reply =
          typeof json?.data?.reply === "string" ? json.data.reply.trim() : "";
        if (reply) {
          return nav?.path
            ? `${reply}\n\n➡️ Sahifani ochdim: ${nav.title || nav.path}`
            : reply;
        }
        if (nav?.path) return `Sahifani ochdim: ${nav.title || nav.path} ✅`;
      } catch {
        void 0;
      }
      return "Kechirasiz, hozir javob bera olmadim. Birozdan so'ng qayta yozing — adminga ham xabar berildi.";
    },
    [router],
  );

  const sendReport = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      const res = await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({
          message: captured.current?.message ?? "Foydalanuvchi AI yordamchi orqali yubordi",
          stack: captured.current?.stack,
          url: captured.current?.url ?? window.location.pathname,
          note: messages
            .filter((message) => message.role === "user")
            .map((message) => message.text)
            .join(" | ")
            .slice(0, 1000),
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !json?.ok) throw new Error("failed");
      setSent(true);
      aiSay("✅ Adminga yuborildi. Tafsilotlar faqat administratorga ko'rinadi. Boshqa savolingiz bo'lsa — yozib turing, yordam beraman.");
    } catch {
      aiSay("Adminga yuborishda muammo bo'ldi. Birozdan so'ng qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }, [aiSay, messages]);

  const capture = useCallback(
    (message: string, stack?: string, label?: string, autoSend = false) => {
      const now = Date.now();
      if (now - lastAutoAt.current < 20000) return;
      lastAutoAt.current = now;
      captured.current = { message, stack, url: window.location.pathname };
      setSent(false);
      setMessages([
        {
          role: "ai",
          text: label
            ? `Sahifada muammo aniqlandi: ${label}. Birgalikda hal qilamiz 🙂`
            : `Sahifada kutilmagan holat yuz berdi (${friendlyBugLine(message, stack)}). Birgalikda hal qilamiz 🙂`,
          time: fmtClock(new Date()),
        },
      ]);
      setOpen(true);
      void (async () => {
        setBusy(true);
        const reply = await askAiReply([
          {
            role: "user",
            text:
              `Sahifada quyidagi muammo yuz berdi: ${label ?? friendlyBugLine(message, stack)}. ` +
              "Menga qisqa tushuntir (2-3 gap) va qanday hal qilishni ayt.",
            time: fmtClock(new Date()),
          },
        ]);
        setBusy(false);
        aiSay(reply);
        if (autoSend) {
          await sendReport();
        }
      })();
    },
    [aiSay, askAiReply, sendReport],
  );

  useEffect(() => {
    const onError = (event: ErrorEvent) =>
      capture(event.message || "Noma'lum xatolik", event.error?.stack as string | undefined);
    const onReject = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string } | undefined;
      capture(reason?.message ?? String(event.reason ?? "Promise xatosi"), reason?.stack);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, [capture]);

  useEffect(() => {
    const onIssue = (event: Event) => {
      const detail = (
        event as CustomEvent<{ message?: string; label?: string; note?: string; autoSend?: boolean }>
      ).detail;
      if (!detail?.message) return;
      capture(detail.message, undefined, detail.label ?? detail.note, detail.autoSend ?? true);
    };
    window.addEventListener(BUG_ASSISTANT_EVENT, onIssue);
    return () => window.removeEventListener(BUG_ASSISTANT_EVENT, onIssue);
  }, [capture]);

  function openManually() {
    captured.current = null;
    setSent(false);
    setMessages([{ role: "ai", text: GREETING, time: fmtClock(new Date()) }]);
    setOpen(true);
  }

  async function handleSend() {
    const value = input.trim();
    if (!value || busy) return;
    const pending: ChatMessage[] = [...messages, { role: "user", text: value, time: fmtClock(new Date()) }];
    setMessages(pending);
    setInput("");
    setBusy(true);
    const reply = await askAiReply(pending);
    setBusy(false);
    aiSay(reply);
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {!open ? (
        <button
          type="button"
          onClick={openManually}
          className="fixed bottom-24 right-3 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-lift transition-transform duration-150 hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-900 text-[11px] text-white">
            AI
          </span>
          Yordam
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-x-0 top-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-white md:inset-auto md:bottom-6 md:right-6 md:h-auto md:w-[23rem] md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl md:ring-1 md:ring-slate-900/5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-900 text-[10px] font-semibold text-white">
                AI
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">AI yordamchi</p>
                <p className="text-[11px] text-slate-600">DeepSeek · adminga yuboradi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Yopish"
              className="rounded-full px-2 py-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3.5 md:max-h-72 md:flex-none">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "ai"
                    ? "bg-slate-100 text-slate-700"
                    : "ml-auto bg-brand-900 text-white",
                )}
              >
                {message.text}
                <span
                  className={cn(
                    "mt-0.5 block text-right text-[10px]",
                    message.role === "ai" ? "text-slate-400" : "text-brand-200",
                  )}
                >
                  {message.time}
                </span>
              </div>
            ))}
            {busy ? (
              <div className="w-fit rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                AI yozmoqda…
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-slate-100 px-4 py-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Xabar yozing..."
                aria-label="AI yordamchiga xabar"
              />
              <Button size="sm" onClick={() => void handleSend()} disabled={!input.trim() || busy}>
                Yuborish
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={busy || sent}
                onClick={() => void sendReport()}
                className={cn(
                  "text-xs font-medium transition-colors",
                  sent
                    ? "text-emerald-600"
                    : "text-brand-700 hover:text-brand-900 hover:underline",
                )}
              >
                {sent ? "✅ Adminga yuborilgan" : "📤 Muammoni adminga yuborish"}
              </button>
              <span className="text-[10px] text-slate-600">Tafsilotlar faqat adminga ko&apos;rinadi</span>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
