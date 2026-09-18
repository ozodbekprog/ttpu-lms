"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Label,
  Select,
  Table,
  Textarea,
} from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_TYPE_LABEL,
  toOrderStatus,
  toOrderType,
  type OrderStatus,
} from "./shared";

export type AdminOrderItem = {
  id: string;
  type: string;
  subject: string | null;
  note: string | null;
  status: string;
  adminComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    group: { name: string } | null;
  };
};

type ApiResult = { ok: boolean; error?: string };

function AdminOrderRow({ order }: { order: AdminOrderItem }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(toOrderStatus(order.status));
  const [comment, setComment] = useState(order.adminComment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const current = toOrderStatus(order.status);
  const dirty = status !== current || comment !== (order.adminComment ?? "");

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminComment: comment.trim() || null }),
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json?.error ?? "Saqlab bo'lmadi");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Tarmoqda xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-slate-50 align-top transition-colors duration-150 last:border-0 hover:bg-slate-50/60">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={order.user.name} className="size-8 text-[11px]" />
          <div className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{order.user.name}</span>
            <span className="block truncate text-xs text-slate-500">
              {order.user.group?.name ? `${order.user.group.name} · ` : ""}
              {order.user.email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className="block max-w-sm font-medium text-slate-900">
          {order.subject ?? ORDER_TYPE_LABEL[toOrderType(order.type)]}
        </span>
        {order.note ? (
          <span className="mt-0.5 block max-w-sm text-xs leading-relaxed text-slate-500">
            {order.note}
          </span>
        ) : null}
      </td>
      <td className="px-5 py-3">
        <Badge tone="slate">{ORDER_TYPE_LABEL[toOrderType(order.type)]}</Badge>
      </td>
      <td className="px-5 py-3">
        <Badge tone={ORDER_STATUS_TONE[current]}>{ORDER_STATUS_LABEL[current]}</Badge>
      </td>
      <td className="px-5 py-3 text-xs text-slate-500">{fmtDateTime(order.createdAt)}</td>
      <td className="px-5 py-3">
        <div className="flex w-64 flex-col gap-2">
          <div>
            <Label>Holat</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABEL[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Admin izohi</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Talabaga ko'rinadi"
              rows={2}
              maxLength={2000}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={busy || !dirty} onClick={save}>
              {busy ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            {saved && !dirty ? (
              <span className="text-xs font-medium text-emerald-600">Saqlandi</span>
            ) : null}
            {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminOrdersManager({ orders }: { orders: AdminOrderItem[] }) {
  return (
    <Card>
      <CardHeader title="Arizalar" subtitle={`${orders.length} ta`} />
      {orders.length === 0 ? (
        <CardBody>
          <EmptyState
            title="Arizalar topilmadi"
            description="Tanlangan holat bo'yicha arizalar yo'q."
          />
        </CardBody>
      ) : (
        <Table>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3 font-semibold">Talaba</th>
              <th className="px-5 py-3 font-semibold">Ariza</th>
              <th className="px-5 py-3 font-semibold">Tur</th>
              <th className="px-5 py-3 font-semibold">Holat</th>
              <th className="px-5 py-3 font-semibold">Yuborilgan</th>
              <th className="px-5 py-3 font-semibold">Boshqarish</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <AdminOrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
