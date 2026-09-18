"use client";

import { Card, CardBody, CardHeader } from "@/components/ui";
import { dayName } from "@/lib/utils";
import type { BuilderEntry } from "./types";

export function BuilderStats({ entries, weekParity }: { entries: BuilderEntry[]; weekParity: "odd" | "even" }) {
  const occupied = new Set(entries.map((entry) => `${entry.dayOfWeek}-${entry.slot}`)).size;
  const cancelled = entries.filter((entry) => entry.status === "CANCELLED").length;
  const sorted = entries
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.slot - b.slot);

  return (
    <Card>
      <CardHeader title="Hafta xulosasi" subtitle={weekParity === "even" ? "Juft hafta" : "Toq hafta"} />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-50/70 px-2 py-2">
            <p className="text-xl font-semibold text-brand-900">{entries.length}</p>
            <p className="text-[11px] text-slate-500">dars</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-2">
            <p className="text-xl font-semibold text-brand-900">{48 - occupied}</p>
            <p className="text-[11px] text-slate-500">{"bo'sh slot"}</p>
          </div>
          <div className="rounded-xl bg-rose-50/70 px-2 py-2">
            <p className="text-xl font-semibold text-rose-600">{cancelled}</p>
            <p className="text-[11px] text-slate-500">bekor</p>
          </div>
        </div>

        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {sorted.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
              {"Hozircha dars yo'q — palette'dan tashlang."}
            </p>
          ) : (
            sorted.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                <span className="w-16 shrink-0 font-medium text-slate-500">
                  {`${dayName(entry.dayOfWeek).slice(0, 3)} · ${entry.slot}-par`}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{entry.subject}</span>
                {entry.room ? <span className="shrink-0 text-slate-400">{entry.room}</span> : null}
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
