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
  Select,
  Table,
  Textarea,
} from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_TYPES,
  ORDER_TYPE_LABEL,
  toOrderStatus,
  toOrderType,
  type OrderType,
} from "./shared";

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
        <CardHeader title="Yangi ariza" subtitle="Transkript, ma'lumotnoma yoki boshqa so'rov" />
        <CardBody>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <div>
              <Label>Ariza turi</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as OrderType)}>
                {ORDER_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {ORDER_TYPE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
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
        <CardHeader title="Mening arizalarim" subtitle={`${orders.length} ta`} />
        {orders.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Arizalar yo'q"
              description="Yangi ariza yuboring — holati shu yerda ko'rinadi."
            />
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-semibold">Ariza</th>
                <th className="px-5 py-3 font-semibold">Tur</th>
                <th className="px-5 py-3 font-semibold">Holat</th>
                <th className="px-5 py-3 font-semibold">Yuborilgan</th>
                <th className="px-5 py-3 font-semibold">Admin izohi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = toOrderStatus(order.status);
                return (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 align-top transition-colors duration-150 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3">
                      <span className="block font-medium text-slate-900">
                        {order.subject ?? ORDER_TYPE_LABEL[toOrderType(order.type)]}
                      </span>
                      {order.note ? (
                        <span className="mt-0.5 block max-w-md text-xs leading-relaxed text-slate-500">
                          {order.note}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="slate">{ORDER_TYPE_LABEL[toOrderType(order.type)]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmtDateTime(order.createdAt)}</td>
                    <td className="px-5 py-3">
                      {order.adminComment ? (
                        <span className="block max-w-xs text-xs leading-relaxed text-slate-600">
                          {order.adminComment}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Qayta topshirish"
          subtitle="60% dan past natijalar bo'yicha so'rov yuborish"
        />
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3"
              >
                <div className="min-w-0">
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
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyRetake === item.id}
                  onClick={() => requestRetake(item)}
                >
                  {busyRetake === item.id ? "Yuborilmoqda..." : "Qayta topshirish so'rovi"}
                </Button>
              </div>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
