"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Table } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { auditActionLabel, auditActionTone } from "@/app/(app)/admin/audit/labels";

export type AuditActor = { id: string; name: string; email: string } | null;

export type AuditLogItem = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: unknown;
  createdAt: Date;
  actor: AuditActor;
};

export type AuditQuery = { action: string; date: string };

function formatMetaValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

function metaPreview(meta: unknown): string {
  if (meta === null || meta === undefined) return "—";
  if (typeof meta !== "object") return formatMetaValue(meta);
  if (Array.isArray(meta)) return meta.length > 0 ? meta.map(formatMetaValue).join(", ") : "—";
  const entries = Object.entries(meta as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}: ${formatMetaValue(value)}`).join(" · ");
}

function metaJson(meta: unknown): string {
  if (meta === null || meta === undefined) return "—";
  try {
    return JSON.stringify(meta, null, 2) ?? "—";
  } catch {
    return "—";
  }
}

export default function AuditLogTable({
  logs,
  total,
  page,
  pageCount,
  query,
}: {
  logs: AuditLogItem[];
  total: number;
  page: number;
  pageCount: number;
  query: AuditQuery;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (query.action) params.set("action", query.action);
    if (query.date) params.set("date", query.date);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/admin/audit?${qs}` : "/admin/audit";
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="Audit yozuvlari topilmadi"
        description="Tanlangan filtrlarga mos amallar hali qayd etilmagan."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Amallar tarixi" subtitle={`Jami ${total} ta yozuv`} />
      <Table className="max-h-[68vh] overflow-y-auto">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Vaqt</th>
            <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Kim</th>
            <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Amal</th>
            <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Obyekt</th>
            <th className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 px-5 py-3 font-semibold backdrop-blur">Tafsilot</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const expanded = expandedId === log.id;
            const preview = metaPreview(log.meta);
            return (
              <Fragment key={log.id}>
                <tr className="border-b border-slate-50 align-top transition-colors duration-150 last:border-0 hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                    {fmtDateTime(log.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {log.actor ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar name={log.actor.name} className="size-8 text-[10px] ring-1 ring-slate-900/10" />
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">{log.actor.name}</span>
                          <span className="block truncate text-xs text-slate-500">{log.actor.email}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <path d="M7 9h10M7 13h6" />
                          </svg>
                        </span>
                        <span className="text-sm font-medium text-slate-500">Tizim</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={auditActionTone(log.action)}>{auditActionLabel(log.action)}</Badge>
                    <span className="mt-1 block font-mono text-[11px] text-slate-400">{log.action}</span>
                  </td>
                  <td className="px-5 py-3">
                    {log.entity ? (
                      <>
                        <span className="block text-sm text-slate-700">{log.entity}</span>
                        {log.entityId ? (
                          <span className="block font-mono text-[11px] text-slate-400" title={log.entityId}>
                            {log.entityId.slice(0, 10)}…
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="max-w-xs truncate text-xs text-slate-600" title={preview}>
                      {preview}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : log.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-800"
                    >
                      {expanded ? "Yopish" : "Batafsil"}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={expanded ? "rotate-180 transition-transform duration-150" : "transition-transform duration-150"}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-slate-50 last:border-0">
                    <td colSpan={5} className="bg-slate-50/70 px-5 py-3">
                      <pre className="max-h-72 overflow-auto rounded-xl bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-700 ring-1 ring-slate-200">
                        {metaJson(log.meta)}
                      </pre>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <span className="text-xs text-slate-500">
          Sahifa {page} / {pageCount} · jami {total} ta
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => router.push(pageHref(page - 1))}>
            Oldingi
          </Button>
          <Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => router.push(pageHref(page + 1))}>
            Keyingi
          </Button>
        </div>
      </div>
    </Card>
  );
}
