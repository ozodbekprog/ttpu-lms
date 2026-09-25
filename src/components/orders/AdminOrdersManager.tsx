"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
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
import { cn, fmtDateTime } from "@/lib/utils";
import {
  ORDER_STATUS_DOT,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_STATUSES,
  ORDER_TYPES,
  ORDER_TYPE_LABEL,
  toOrderStatus,
  toOrderType,
  type OrderStatus,
  type OrderType,
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

type TypeFilter = OrderType | "ALL";

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

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
    <tr className="border-b border-slate-50 align-top transition-colors duration-150 last:border-0 hover:bg-brand-50/30">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={order.user.name} className="size-9 text-[11px] ring-2 ring-white" />
          <div className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{order.user.name}</span>
            <span className="block truncate text-xs text-slate-500">
              {order.user.group?.name ? `${order.user.group.name} · ` : ""}
              {order.user.email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="block max-w-sm font-medium text-slate-900">
          {order.subject ?? ORDER_TYPE_LABEL[toOrderType(order.type)]}
        </span>
        {order.note ? (
          <span className="mt-1 block max-w-sm text-xs leading-relaxed text-slate-500">
            {order.note}
          </span>
        ) : null}
      </td>
      <td className="px-5 py-4">
        <Badge tone="slate">{ORDER_TYPE_LABEL[toOrderType(order.type)]}</Badge>
      </td>
      <td className="px-5 py-4">
        <Badge tone={ORDER_STATUS_TONE[current]}>{ORDER_STATUS_LABEL[current]}</Badge>
      </td>
      <td className="px-5 py-4 text-xs text-slate-500">{fmtDateTime(order.createdAt)}</td>
      <td className="px-5 py-4">
        <div className="w-64 space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div>
            <Label>Holat</Label>
            <div className="relative">
              <span
                className={cn(
                  "pointer-events-none absolute left-3.5 top-1/2 size-2 -translate-y-1/2 rounded-full",
                  ORDER_STATUS_DOT[status],
                )}
              />
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="pl-8"
              >
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {ORDER_STATUS_LABEL[value]}
                  </option>
                ))}
              </Select>
            </div>
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
            <Button size="sm" disabled={busy || !dirty} onClick={save} className="flex-1">
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
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const type = toOrderType(order.type);
      if (typeFilter !== "ALL" && type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [
        order.user.name,
        order.user.email,
        order.user.group?.name ?? "",
        order.subject ?? "",
        order.note ?? "",
        ORDER_TYPE_LABEL[type],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, query, typeFilter]);

  return (
    <Card>
      <CardHeader title="Arizalar" subtitle={`${filtered.length} / ${orders.length} ta ko'rsatilmoqda`} />
      {orders.length === 0 ? (
        <CardBody>
          <EmptyState
            title="Arizalar topilmadi"
            description="Tanlangan holat bo'yicha arizalar yo'q."
          />
        </CardBody>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="relative min-w-56 flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                <SearchIcon />
              </span>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Talaba, mavzu yoki izoh bo'yicha qidirish..."
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full sm:w-52"
            >
              <option value="ALL">Barcha turlar</option>
              {ORDER_TYPES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
          </div>
          {filtered.length === 0 ? (
            <CardBody>
              <EmptyState
                title="Mos ariza yo'q"
                description="Qidiruv so'zi yoki turni o'zgartirib qayta urinib ko'ring."
              />
            </CardBody>
          ) : (
            <Table>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-3.5 font-semibold">Talaba</th>
                  <th className="px-5 py-3.5 font-semibold">Ariza</th>
                  <th className="px-5 py-3.5 font-semibold">Tur</th>
                  <th className="px-5 py-3.5 font-semibold">Holat</th>
                  <th className="px-5 py-3.5 font-semibold">Yuborilgan</th>
                  <th className="px-5 py-3.5 font-semibold">Boshqarish</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <AdminOrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </Card>
  );
}
