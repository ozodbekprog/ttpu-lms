"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { friendlyBugLine } from "./bug-utils";
import { BUG_ASSISTANT_EVENT } from "./report";

type ChatMessage = { role: "ai" | "user"; text: string };
type Stage = "ask" | "confirm" | "sent";

type Captured = { message: string; stack?: string; url: string };

export function BugAssistant() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("ask");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const captured = useRef<Captured | null>(null);
  const note = useRef("");
  const lastAutoAt = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const aiSay = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "ai", text }]);
  }, []);

  const capture = useCallback(
    (message: string, stack?: string, label?: string, autoSend = false) => {
      const now = Date.now();
      if (now - lastAutoAt.current < 20000) return;
      lastAutoAt.current = now;
      captured.current = { message, stack, url: window.location.pathname };
      note.current = label ? `Avtomatik: ${label}` : "";
      setMessages([
        { role: "ai", text: "Salom! Men saytning AI yordamchisiman 🤖" },
        {
          role: "ai",
          text: label
            ? `Sahifada muammo aniqlandi: ${label}.`
            : `Sahifada kutilmagan holat yuz berdi (${friendlyBugLine(message, stack)}).`,
        },
      ]);
      setStage("ask");
      setOpen(true);
      void (async () => {
        setBusy(true);
        const reply = await askAiReply([
          {
            role: "user",
            text:
              `Sahifada quyidagi muammo yuz berdi: ${label ?? friendlyBugLine(message, stack)}. ` +
              "Menga qisqa tushuntir (2-3 gap) va qanday hal qilishni ayt.",
          },
        ]);
        setBusy(false);
        if (reply) aiSay(reply);
        if (autoSend) {
          await sendReport();
        } else {
          setStage("confirm");
        }
      })();
    },
    [],
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
    note.current = "";
    setMessages([
      {
        role: "ai",
        text: "Salom! Men saytning AI yordamchisiman 🤖 Muammoni qisqacha tasvirlab bering — tafsilotlarni adminga yuboraman.",
      },
    ]);
    setStage("ask");
    setOpen(true);
  }

  async function sendReport() {
    setBusy(true);
    try {
      const res = await apiFetch("/api/bugs", {
        method: "POST",
        body: JSON.stringify({
          message: captured.current?.message ?? "Foydalanuvchi xabari",
          stack: captured.current?.stack,
          url: captured.current?.url ?? window.location.pathname,
          note: note.current || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !json?.ok) throw new Error("failed");
      aiSay("✅ Xabar adminga yuborildi. Tafsilotlar faqat administratorga ko'rinadi.");
      setStage("sent");
    } catch {
      aiSay("Yuborishda muammo bo'ldi. Birozdan so'ng qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function askAiReply(pending: ChatMessage[]): Promise<string> {
    try {
      const res = await apiFetch("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: pending
            .slice(-8)
            .map((message) => ({
              role: message.role === "ai" ? "assistant" : "user",
              content: message.text,
            })),
          context: captured.current
            ? { url: captured.current.url, errorMessage: captured.current.message }
            : undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: { reply?: string } }
        | null;
      const reply = json?.data?.reply;
      if (typeof reply === "string" && reply.trim()) return reply.trim();
    } catch {
      void 0;
    }
    return "Rahmat! Tafsilotlarni adminga yuboraymi?";
  }

  async function handleSend() {
    const value = input.trim();
    if (!value || busy) return;
    if (stage === "sent") {
      aiSay("Xabaringiz allaqachon yuborilgan ✅ Rahmat!");
      setInput("");
      return;
    }
    const pending: ChatMessage[] = [...messages, { role: "user", text: value }];
    setMessages(pending);
    note.current = note.current ? `${note.current} | ${value}` : value;
    setInput("");
    if (stage === "confirm") {
      aiSay("Yuborish uchun pastdagi tugmani bosing 🙂");
      return;
    }
    setBusy(true);
    const reply = await askAiReply(pending);
    setBusy(false);
    aiSay(reply);
    setStage("confirm");
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={openManually}
          className="fixed bottom-24 left-3 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-lift transition-transform duration-150 hover:scale-105 active:scale-95 md:bottom-6 md:left-6"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-900 text-[11px] text-white">
            AI
          </span>
          Yordam
        </button>
      ) : null}

      {open ? (
        <div className="fixed bottom-20 left-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5 md:bottom-6 md:left-6">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-900 text-[10px] font-semibold text-white">
                AI
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">AI yordamchi</p>
                <p className="text-[11px] text-slate-400">Xatoliklarni adminga yuboradi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Yopish"
              className="rounded-full px-2 py-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-64 space-y-2.5 overflow-y-auto px-4 py-3.5"
          >
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
              </div>
            ))}
            {busy ? (
              <div className="w-fit rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
                AI yozmoqda…
              </div>
            ) : null}
          </div>

          <div className="space-y-2.5 border-t border-slate-100 px-4 py-3">
            {stage === "confirm" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => {
                    void sendReport();
                  }}
                >
                  {busy ? "Yuborilmoqda..." : "Ha, adminga yuborish"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => {
                    aiSay("Mayli 🙂 Muammo davom etsa, shu yerdan yozib turing.");
                    setStage("sent");
                  }}
                >
                  Yo&apos;q
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Xabar yozing..."
                    aria-label="AI yordamchiga xabar"
                  />
                  <Button size="sm" onClick={handleSend} disabled={!input.trim() || busy}>
                    Yuborish
                  </Button>
                </div>
                <p className="text-[11px] leading-snug text-slate-400">
                  Xatolik tafsilotlari faqat administratorga ko&apos;rinadi.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
