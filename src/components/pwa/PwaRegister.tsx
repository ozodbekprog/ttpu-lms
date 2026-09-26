"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ttpu-pwa-install-dismissed";

export function PwaRegister() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setPromptEvent(null);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setPromptEvent(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-xl">
      <img src="/logo.svg" alt="" width={40} height={40} className="shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">Ilovani o&apos;rnatish</p>
        <p className="text-xs text-slate-500">TTPU LMS ni ilova sifatida ochish</p>
      </div>
      <button
        type="button"
        onClick={install}
        className="shrink-0 rounded-lg bg-brand-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
      >
        O&apos;rnatish
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Yopish"
        className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
