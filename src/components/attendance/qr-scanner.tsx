"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui";
import { tokenFromQr } from "./live-qr";
import { reportIssue } from "@/components/bugs/report";

export function QrScanner({
  onDetected,
  onCancel,
}: {
  onDetected: (token: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectedRef = useRef(onDetected);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    detectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    function stop() {
      stopped = true;
      window.cancelAnimationFrame(raf);
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    }

    function tick() {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            context.drawImage(video, 0, 0, width, height);
            const frame = context.getImageData(0, 0, width, height);
            const code = jsQR(frame.data, width, height, { inversionAttempts: "dontInvert" });
            const token = code?.data ? tokenFromQr(code.data) : null;
            if (token) {
              stop();
              detectedRef.current(token);
              return;
            }
          }
        }
      }
      raf = window.requestAnimationFrame(tick);
    }

    async function start() {
      setError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Bu brauzerda kamera ishlamaydi. Boshqa brauzerda urinib ko'ring.");
          reportIssue({
            message: "Brauzerda getUserMedia mavjud emas (kamera qo'llab-quvvatlanmaydi)",
            label: "brauzer kamerani qo'llab-quvvatlamaydi",
            autoSend: true,
          });
          return;
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
        } catch (first) {
          if (first instanceof DOMException && first.name === "OverconstrainedError") {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } else {
            throw first;
          }
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        raf = window.requestAnimationFrame(tick);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "Error";
        let message: string;
        if (name === "NotAllowedError" || name === "SecurityError") {
          message =
            "Kameraga ruxsat berilmagan. Manzil qatoridagi kamera belgisidan ruxsat bering (yoki brauzer sozlamalarida sayt uchun kamerani yoqing) va «Qayta urinish»ni bosing.";
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          message = "Qurilmada kamera topilmadi. Kamera ulanganini tekshiring.";
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          message = "Kamera boshqa dastur tomonidan band. Uni yopib, qayta urinib ko'ring.";
        } else {
          message = "Kamera ochilmadi. Qayta urinib ko'ring.";
        }
        setError(message);
        reportIssue({
          message: `Kamera ochilmadi: ${name} — ${message}`,
          label: "kamera ochilmadi",
          autoSend: true,
        });
      }
    }

    void start();
    return stop;
  }, [attempt]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="aspect-square w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        <span className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
        <span className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 animate-pulse bg-emerald-400/80" />
      </div>
      {error ? (
        <div className="space-y-2">
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">{error}</p>
          <Button variant="secondary" className="w-full" onClick={() => setAttempt((n) => n + 1)}>
            Qayta urinish
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500">
          O&apos;qituvchi ekranidagi QR kodni ramka ichiga tuting
        </p>
      )}
      <Button variant="secondary" className="w-full" onClick={onCancel}>
        Bekor qilish
      </Button>
    </div>
  );
}
