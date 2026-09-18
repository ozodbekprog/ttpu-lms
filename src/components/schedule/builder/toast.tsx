"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ToastMessage } from "./types";

export function BuilderToast({
  toast,
  onClose,
  onAction,
}: {
  toast: ToastMessage | null;
  onClose: () => void;
  onAction?: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 px-4">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-lg",
          toast.tone === "error"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700",
        )}
      >
        {toast.text}
        {toast.actionLabel && onAction ? (
          <button
            type="button"
            onClick={() => {
              onAction();
              onClose();
            }}
            className="rounded-lg bg-white/80 px-2 py-0.5 text-xs font-semibold underline-offset-2 hover:underline"
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="text-xs opacity-60 transition-opacity hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
}
