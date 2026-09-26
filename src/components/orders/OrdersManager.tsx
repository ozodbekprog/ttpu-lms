"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Progress,
  Textarea,
} from "@/components/ui";
import { cn, fmtDateTime } from "@/lib/utils";
import {
  ORDER_STATUS_DOT,
  ORDER_STATUS_HINT,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_TYPE_HINT,
  ORDER_TYPE_LABEL,
  ORDER_TYPES,
  toOrderStatus,
  toOrderType,
  type OrderType,
} from "./shared";
import type { ReactNode } from "react";

export type OrderItem = {
  id: string;
  type: string;
  subject: string | null;
  note: string | null;
  status: string;
  adminComment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RetakeItem = {
  id: string;
  kind: "QUIZ" | "ASSIGNMENT";
  title: string;
  course: string | null;
  score: number;
  max: number;
  percent: number;
};

type ApiResult = { ok: boolean; error?: string };

const RETAKE_KIND_LABEL: Record<RetakeItem["kind"], string> = {
  QUIZ: "Test",
  ASSIGNMENT: "Topshiriq",
};

const TYPE_ICONS: Record<OrderType, ReactNode> = {
  TRANSCRIPT: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  CERTIFICATE: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14.5 7.5 22l4.5-2.5L16.5 22 15 14.5" />
      <path d="m10 9 1.5 1.5L14.5 7.5" />
    </svg>
  ),
  RETAKE: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  OTHER: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M9.5 10h.01M12.5 10h.01M15.5 10h.01" />
    </svg>
  ),
};

function TimelineRow({ label, date, dot }: { label: string; date: string; dot: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      <span className="font-medium text-slate-600">{label}</span>
      <span className="ml-auto text-slate-600">{date}</span>
    </div>
  );
}

function OrderTimelineItem({ order }: { order: OrderItem }) {
  const status = toOrderStatus(order.status);
  const type = toOrderType(order.type);
  return (
    <div className="relative flex gap-4">
      <span className={cn("relative z-10 mt-2 size-2.5 shrink-0 rounded-full ring-4 ring-white", ORDER_STATUS_DOT[status])} />
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{order.subject ?? ORDER_TYPE_LABEL[type]}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="slate">{ORDER_TYPE_LABEL[type]}</Badge>
              <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
            </div>
          </div>
          <span className="text-xs text-slate-600">{fmtDateTime(order.createdAt)}</span>
        </div>
        {order.note ? (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{order.note}</p>
        ) : null}
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          <TimelineRow label="Yuborildi" date={fmtDateTime(order.createdAt)} dot="bg-brand-300" />
          <TimelineRow
            label={ORDER_STATUS_HINT[status]}
            date={fmtDateTime(order.updatedAt)}
            dot={ORDER_STATUS_DOT[status]}
          />
        </div>
        {order.adminComment ? (
          <div className="mt-3 rounded-xl bg-brand-50/70 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Admin izohi</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{order.adminComment}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OrdersManager({
  orders,
  retakes,
}: {
  orders: OrderItem[];
  retakes: RetakeItem[];
}) {
  const router = useRouter();
  const [type, setType] = useState<OrderType>("TRANSCRIPT");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyRetake, setBusyRetake] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function send(url: string, method: "POST", body: unknown) {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json?.error ?? "Amalni bajarib bo'lmadi");
        return null;
      }
      return json;
    } catch {
      setError("Tarmoqda xatolik");
      return null;
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const json = await send("/api/orders", "POST", {
      type,
      subject,
      note: note.trim() || null,
    });
    setBusy(false);
    if (!json) return;
    setType("TRANSCRIPT");
    setSubject("");
    setNote("");
    setNotice("Ariza yuborildi");
    router.refresh();
  }

  async function requestRetake(item: RetakeItem) {
    setBusyRetake(item.id);
    const json = await send("/api/orders", "POST", {
      type: "RETAKE",
      subject: `Qayta topshirish: ${item.title}`.slice(0, 200),
      note: `${item.course ? `${item.course} · ` : ""}${RETAKE_KIND_LABEL[item.kind]} natijasi: ${item.score}/${item.max} (${item.percent}%)`,
    });
    setBusyRetake(null);
    if (!json) return;
    setNotice("Qayta topshirish arizasi yuborildi");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {notice}
        </span>
      ) : null}
      {error ? (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader
          title="Yangi ariza"
          subtitle="Avval ariza turini tanlang, so'ng mavzuni kiriting"
          action={
            <Badge tone="blue">
              <span className={cn("mr-1.5 size-1.5 rounded-full", ORDER_STATUS_DOT.NEW)} />
              {ORDER_TYPE_LABEL[type]}
            </Badge>
          }
        />
        <CardBody>
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
            <div className="sm:col-span-2">
              <Label>Ariza turi</Label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {ORDER_TYPES.map((value) => {
                  const active = type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150",
                        active
                          ? "border-brand-500 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/15"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
                          active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {TYPE_ICONS[value]}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-sm font-semibold", active ? "text-brand-800" : "text-slate-800")}>
                          {ORDER_TYPE_LABEL[value]}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                          {ORDER_TYPE_HINT[value]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Mavzu</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Masalan: 4-semestr transkripti"
                minLength={2}
                maxLength={200}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Izoh</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Qo'shimcha ma'lumot (ixtiyoriy)"
                rows={3}
                maxLength={2000}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy || subject.trim().length < 2}>
                {busy ? "Yuborilmoqda..." : "Ariza yuborish"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mening arizalarim" subtitle={`${orders.length} ta so'rov`} />
        {orders.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Arizalar yo'q"
              description="Yangi ariza yuboring — holati shu yerda vaqt chizig'i ko'rinishida chiqadi."
            />
          </CardBody>
        ) : (
          <CardBody>
            <div className="relative space-y-4 before:absolute before:bottom-6 before:left-[5px] before:top-2 before:w-px before:bg-slate-200/80">
              {orders.map((order) => (
                <OrderTimelineItem key={order.id} order={order} />
              ))}
            </div>
          </CardBody>
        )}
      </Card>

      <Card className="overflow-hidden border-amber-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-amber-50/60 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 8v4l3 2" />
              </svg>
            </span>
            <div>
              <h3 className="font-semibold tracking-tight text-slate-900">Qayta topshirish</h3>
              <p className="mt-0.5 text-sm text-amber-700/80">{"60% dan past natijalar bo'yicha so'rov yuborish"}</p>
            </div>
          </div>
          <Badge tone="amber">{retakes.length} ta fan</Badge>
        </div>
        {retakes.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Muvaffaqiyatsiz natijalar yo'q"
              description="Barcha test va topshiriqlar 60% dan yuqori baholangan."
            />
          </CardBody>
        ) : (
          <CardBody className="space-y-3">
            {retakes.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-amber-200/70 bg-amber-50/40 px-4 py-3.5 transition-colors duration-150 hover:bg-amber-50/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{item.title}</span>
                      <Badge tone="slate">{RETAKE_KIND_LABEL[item.kind]}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.course ? `${item.course} · ` : ""}Natija:{" "}
                      <span className="font-semibold text-rose-600">
                        {item.score}/{item.max} ({item.percent}%)
                      </span>
                    </p>
                    <Progress value={item.percent} className="mt-2.5 max-w-xs" />
                  </div>
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={busyRetake === item.id}
                    onClick={() => requestRetake(item)}
                  >
                    {busyRetake === item.id ? "Yuborilmoqda..." : "Qayta topshirish so'rovi"}
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
