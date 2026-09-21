"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Label, Textarea } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  mine: boolean;
};

type ReviewsData = {
  average: number | null;
  count: number;
  distribution: { rating: number; count: number }[];
  reviews: ReviewItem[];
};

type ReviewsResponse = {
  ok?: boolean;
  data?: ReviewsData;
  error?: string;
};

const STAR_PATH =
  "M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.04 1.11-6.46-4.7-4.58 6.49-.94L12 2.6z";

function Stars({ value, className, size = 14 }: { value: number; className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn(star <= value ? "text-gold-500 drop-shadow-sm" : "text-slate-300")}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          aria-label={`${star} yulduz`}
          className="rounded-md p-0.5 transition-transform duration-150 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn(
              "transition-colors duration-150",
              star <= value ? "text-gold-500 drop-shadow-sm" : "text-slate-300 hover:text-gold-300",
            )}
          >
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </span>
  );
}

export function CourseReviews({
  courseId,
  isEnrolled,
  canManage,
}: {
  courseId: string;
  isEnrolled: boolean;
  canManage: boolean;
}) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/reviews`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as ReviewsResponse | null;
      if (!res.ok || !json?.ok || !json.data) {
        setError(json?.error ?? "Sharhlarni yuklab bo'lmadi");
        return;
      }
      const mineReview = json.data.reviews.find((review) => review.mine);
      if (mineReview) {
        setRating(mineReview.rating);
        setComment(mineReview.comment ?? "");
      }
      setData(json.data);
      setError(null);
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const mine = data?.reviews.find((review) => review.mine) ?? null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || rating < 1) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() ? comment.trim() : null }),
      });
      const json = (await res.json().catch(() => null)) as ReviewsResponse | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Sharhni saqlab bo'lmadi");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      await load();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy || !window.confirm("Sharhingiz o'chirilsinmi?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as ReviewsResponse | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Sharhni o'chirib bo'lmadi");
        return;
      }
      setRating(0);
      setComment("");
      await load();
    } catch {
      setError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Sharhlar"
        subtitle={
          data && data.count > 0
            ? `${data.count} ta sharh · o'rtacha ${data.average}`
            : "Kurs haqida talabalar fikri"
        }
      />
      <CardBody className="space-y-5">
        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
        ) : null}

        {loading && !data ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : null}

        {data ? (
          data.count === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
              <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-gold-300/20 text-gold-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d={STAR_PATH} />
                </svg>
              </span>
              <p className="text-sm font-medium text-slate-600">Hozircha sharhlar yo&apos;q</p>
              <p className="text-xs text-slate-400">
                Birinchi bo&apos;lib fikringizni qoldiring.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
              <div className="flex items-center gap-5">
                <div className="relative inline-flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-lift">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" fill="none">
                    <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(((data.average ?? 0) / 5) * 289).toFixed(1)} 289`}
                      className="text-gold-400"
                    />
                  </svg>
                  <span className="relative flex flex-col items-center">
                    <span className="text-3xl font-semibold tracking-tight">
                      {(data.average ?? 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/60">/ 5</span>
                  </span>
                </div>
                <div>
                  <Stars value={Math.round(data.average ?? 0)} size={18} />
                  <p className="mt-1.5 text-sm font-medium text-slate-700">{data.count} ta sharh</p>
                </div>
              </div>
              {canManage ? (
                <div className="min-w-56 flex-1 space-y-2">
                  {data.distribution.map((row) => (
                    <div key={row.rating} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-3 text-right font-semibold tabular-nums text-slate-600">
                        {row.rating}
                      </span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-gold-500">
                        <path d={STAR_PATH} />
                      </svg>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
                          style={{ width: `${Math.round((row.count / data.count) * 100)}%` }}
                        />
                      </div>
                      <span className="w-6 text-right tabular-nums">{row.count}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {isEnrolled ? (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-gold-300/50 bg-gradient-to-br from-gold-300/10 via-white to-brand-50/50 p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                {mine ? "Sharhingizni tahrirlash" : "Sharh qoldiring"}
              </p>
              {mine ? <Badge tone="gold">Sizning sharhingiz</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StarInput value={rating} onChange={setRating} disabled={busy} />
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  rating > 0
                    ? "bg-white text-gold-600 ring-gold-300/60"
                    : "bg-white/70 text-slate-400 ring-slate-200",
                )}
              >
                {rating > 0 ? `${rating} / 5` : "Yulduz tanlang"}
              </span>
            </div>
            <div>
              <Label>Izoh (ixtiyoriy)</Label>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Kurs haqida fikringiz..."
              />
              <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/500</p>
            </div>
            {saved ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Sharh saqlandi.
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              {mine ? (
                <Button
                  variant="ghost"
                  className="text-rose-600"
                  disabled={busy}
                  onClick={remove}
                >
                  {"O'chirish"}
                </Button>
              ) : null}
              <Button type="submit" disabled={busy || rating < 1}>
                {mine ? "Saqlash" : "Yuborish"}
              </Button>
            </div>
          </form>
        ) : null}

        {data && data.reviews.length > 0 ? (
          <ul className="space-y-3">
            {data.reviews.map((review) => (
              <li
                key={review.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-150 hover:border-brand-100 hover:shadow-sm"
              >
                <Avatar name={review.user.name} src={review.user.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-slate-900">{review.user.name}</span>
                    {review.mine ? <Badge tone="gold">Siz</Badge> : null}
                    <Stars value={review.rating} />
                    <span className="ml-auto text-xs text-slate-400">{fmtDate(review.createdAt)}</span>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}
