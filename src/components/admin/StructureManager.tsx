"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, Label, Table } from "@/components/ui";
import { cn } from "@/lib/utils";

export type StructureFaculty = {
  id: string;
  name: string;
  code: string | null;
  groupsCount: number;
  groupIds: string[];
};

export type StructureTerm = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sessionsCount: number;
};

export type StructureGroup = {
  id: string;
  name: string;
  facultyId: string | null;
  userCount: number;
};

type TabKey = "faculties" | "terms";
type Mode = "create" | "edit" | null;
type ApiResult = { ok: boolean; error?: string };

const TABS: Array<{ key: TabKey; label: string; icon: ReactNode }> = [
  {
    key: "faculties",
    label: "Fakultetlar",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
        <path d="M15 9h2a2 2 0 0 1 2 2v10" />
        <path d="M8 7h4M8 11h4M8 15h4" />
      </svg>
    ),
  },
  {
    key: "terms",
    label: "Semestrlar",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
];

const TAB_ACTIVE: Record<TabKey, string> = {
  faculties: "from-brand-800 to-brand-950 shadow-brand-900/25",
  terms: "from-sky-500 to-brand-800 shadow-sky-500/25",
};

const GRADIENTS: Record<TabKey, string> = {
  faculties: "from-brand-900 via-brand-500 to-gold-400",
  terms: "from-sky-400 via-brand-500 to-brand-900",
};

const SECTION_META: Record<TabKey, { title: string; subtitle: string; create: string; edit: string }> = {
  faculties: {
    title: "Fakultetlar",
    subtitle: "Fakultetlar va guruhlar taqsimoti",
    create: "Yangi fakultet",
    edit: "Fakultetni tahrirlash",
  },
  terms: {
    title: "Semestrlar",
    subtitle: "O'quv semestrlari va ularning holati",
    create: "Yangi semestr",
    edit: "Semestrni tahrirlash",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

function termProgress(startDate: string, endDate: string) {
  const start = Date.parse(startDate.slice(0, 10));
  const end = Date.parse(endDate.slice(0, 10));
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)));
}

export default function StructureManager({
  faculties,
  terms,
  groups,
}: {
  faculties: StructureFaculty[];
  terms: StructureTerm[];
  groups: StructureGroup[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("faculties");
  const [mode, setMode] = useState<Mode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [facultyForm, setFacultyForm] = useState({ name: "", code: "" });
  const [termForm, setTermForm] = useState({ name: "", startDate: "", endDate: "", isActive: false });
  const [assignment, setAssignment] = useState<StructureFaculty | null>(null);
  const [assignmentIds, setAssignmentIds] = useState<string[]>([]);
  const [groupQuery, setGroupQuery] = useState("");

  const counts: Record<TabKey, number> = {
    faculties: faculties.length,
    terms: terms.length,
  };
  const meta = SECTION_META[tab];
  const activeTab = TABS.find((item) => item.key === tab);

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const faculty of faculties) map.set(faculty.id, faculty.name);
    return map;
  }, [faculties]);

  const groupSearch = groupQuery.trim().toLowerCase();
  const filteredGroups = groupSearch
    ? groups.filter((group) => group.name.toLowerCase().includes(groupSearch))
    : groups;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!assignment) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAssignment(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [assignment]);

  function switchTab(key: TabKey) {
    setTab(key);
    setMode(null);
    setEditId(null);
    setError(null);
  }

  function openCreate() {
    setMode("create");
    setEditId(null);
    setError(null);
    setNotice(null);
    if (tab === "faculties") setFacultyForm({ name: "", code: "" });
    else setTermForm({ name: "", startDate: "", endDate: "", isActive: false });
  }

  function openEditFaculty(faculty: StructureFaculty) {
    setMode("edit");
    setEditId(faculty.id);
    setFacultyForm({ name: faculty.name, code: faculty.code ?? "" });
    setError(null);
    setNotice(null);
  }

  function openEditTerm(term: StructureTerm) {
    setMode("edit");
    setEditId(term.id);
    setTermForm({
      name: term.name,
      startDate: term.startDate.slice(0, 10),
      endDate: term.endDate.slice(0, 10),
      isActive: term.isActive,
    });
    setError(null);
    setNotice(null);
  }

  function closeForm() {
    setMode(null);
    setEditId(null);
    setError(null);
  }

  async function send(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !json || !json.ok) {
        setError(json?.error ?? "Amalni bajarib bo'lmadi");
        return false;
      }
      return true;
    } catch {
      setError("Tarmoqda xatolik");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitFaculty() {
    const payload = {
      name: facultyForm.name.trim(),
      code: facultyForm.code.trim() ? facultyForm.code.trim() : null,
    };
    const ok =
      mode === "create"
        ? await send("/api/admin/faculties", "POST", payload)
        : await send(`/api/admin/faculties/${editId}`, "PATCH", payload);
    if (!ok) return;
    setNotice(mode === "create" ? "Fakultet qo'shildi" : "Fakultet yangilandi");
    closeForm();
    router.refresh();
  }

  async function submitTerm() {
    const payload = {
      name: termForm.name.trim(),
      startDate: termForm.startDate,
      endDate: termForm.endDate,
      isActive: termForm.isActive,
    };
    const ok =
      mode === "create"
        ? await send("/api/admin/terms", "POST", payload)
        : await send(`/api/admin/terms/${editId}`, "PATCH", payload);
    if (!ok) return;
    setNotice(mode === "create" ? "Semestr qo'shildi" : "Semestr yangilandi");
    closeForm();
    router.refresh();
  }

  async function remove(url: string, question: string, message: string) {
    if (!window.confirm(question)) return;
    const ok = await send(url, "DELETE");
    if (!ok) return;
    setNotice(message);
    router.refresh();
  }

  async function activateTerm(term: StructureTerm) {
    const ok = await send(`/api/admin/terms/${term.id}`, "PATCH", { isActive: true });
    if (!ok) return;
    setNotice(`"${term.name}" aktiv semestr qilindi`);
    router.refresh();
  }

  function openAssignment(faculty: StructureFaculty) {
    setAssignment(faculty);
    setAssignmentIds(faculty.groupIds);
    setGroupQuery("");
    setError(null);
    setNotice(null);
  }

  function toggleGroup(id: string) {
    setAssignmentIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  async function saveAssignment() {
    if (!assignment) return;
    const ok = await send(`/api/admin/faculties/${assignment.id}`, "PATCH", { groupIds: assignmentIds });
    if (!ok) return;
    setNotice(`"${assignment.name}" fakultetiga guruhlar saqlandi`);
    setAssignment(null);
    router.refresh();
  }

  const facultyValid = facultyForm.name.trim().length >= 2;
  const termValid =
    termForm.name.trim().length >= 2 &&
    Boolean(termForm.startDate) &&
    Boolean(termForm.endDate) &&
    termForm.endDate > termForm.startDate;

  return (
    <div className="space-y-4">
      <div className="animate-fade-up flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_30px_-22px_rgba(29,52,96,0.25)]">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => switchTab(item.key)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                active
                  ? `bg-gradient-to-b text-white shadow-md ${TAB_ACTIVE[item.key]}`
                  : "text-slate-600 hover:-translate-y-px hover:bg-slate-100 hover:text-brand-900",
              )}
            >
              <span className={cn("transition-transform duration-200", !active && "group-hover:scale-110")}>
                {item.icon}
              </span>
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {notice ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {notice}
          </span>
        ) : null}
        {error ? (
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </span>
        ) : null}
      </div>

      {mode ? (
        <Card className="animate-fade-up relative overflow-hidden border-brand-200/70">
          <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", GRADIENTS[tab])} />
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    TAB_ACTIVE[tab],
                  )}
                >
                  {activeTab?.icon}
                </span>
                {mode === "create" ? meta.create : meta.edit}
              </span>
            }
            subtitle={meta.subtitle}
            action={
              <Button variant="ghost" size="sm" onClick={closeForm}>
                Yopish
              </Button>
            }
          />
          <CardBody>
            {tab === "faculties" ? (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitFaculty();
                }}
              >
                <div>
                  <Label>Nomi</Label>
                  <Input
                    value={facultyForm.name}
                    onChange={(event) => setFacultyForm((form) => ({ ...form, name: event.target.value }))}
                    placeholder="Masalan: Computer Science"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label>Kod</Label>
                  <Input
                    value={facultyForm.code}
                    onChange={(event) => setFacultyForm((form) => ({ ...form, code: event.target.value }))}
                    placeholder="CS"
                    maxLength={20}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <span className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-600 text-[11px] font-semibold uppercase text-white shadow-sm">
                      {facultyValid ? initials(facultyForm.name) : "··"}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-700">
                      {facultyForm.name.trim() || "Fakultet nomi"}
                    </span>
                    {facultyForm.code.trim() ? (
                      <Badge tone="slate" className="font-mono">
                        {facultyForm.code.trim()}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" onClick={closeForm}>
                      Bekor qilish
                    </Button>
                    <Button type="submit" disabled={busy || !facultyValid}>
                      {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                    </Button>
                  </span>
                </div>
              </form>
            ) : (
              <form
                className="grid gap-4 sm:grid-cols-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitTerm();
                }}
              >
                <div className="sm:col-span-3">
                  <Label>Nomi</Label>
                  <Input
                    value={termForm.name}
                    onChange={(event) => setTermForm((form) => ({ ...form, name: event.target.value }))}
                    placeholder="Masalan: 2026-27 Kuzgi semestr"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label>Boshlanish</Label>
                  <Input
                    type="date"
                    value={termForm.startDate}
                    onChange={(event) => setTermForm((form) => ({ ...form, startDate: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Tugash</Label>
                  <Input
                    type="date"
                    value={termForm.endDate}
                    onChange={(event) => setTermForm((form) => ({ ...form, endDate: event.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2.5 transition-colors duration-150 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={termForm.isActive}
                      onChange={(event) => setTermForm((form) => ({ ...form, isActive: event.target.checked }))}
                      className="size-4 shrink-0 rounded border-slate-300 accent-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    />
                    <span className="text-sm font-medium text-slate-700">Aktiv semestr</span>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                  <span className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 py-2">
                    <Badge tone={termForm.isActive ? "green" : "slate"}>{termForm.isActive ? "Aktiv" : "Nofaol"}</Badge>
                    <span className="text-sm font-medium tabular-nums text-slate-700">
                      {termForm.startDate ? formatDate(termForm.startDate) : "··"} — {termForm.endDate ? formatDate(termForm.endDate) : "··"}
                    </span>
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" onClick={closeForm}>
                      Bekor qilish
                    </Button>
                    <Button type="submit" disabled={busy || !termValid}>
                      {busy ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
                    </Button>
                  </span>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card key={tab} className="animate-fade-in relative overflow-hidden">
        <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", GRADIENTS[tab])} />
        <CardHeader
          title={meta.title}
          subtitle={`${counts[tab]} ta yozuv`}
          action={
            <Button size="sm" onClick={openCreate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {meta.create}
            </Button>
          }
        />
        {counts[tab] === 0 ? (
          <CardBody>
            <EmptyState
              title={`${meta.title} hozircha bo'sh`}
              description={`Birinchi yozuvni qo'shing — "${meta.create}" tugmasi orqali.`}
              action={
                <Button size="sm" variant="secondary" onClick={openCreate}>
                  + {meta.create}
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {tab === "faculties" ? (
                  <>
                    <th className="px-5 py-3 font-semibold">Fakultet</th>
                    <th className="px-5 py-3 font-semibold">Kod</th>
                    <th className="px-5 py-3 font-semibold">Guruhlar</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-3 font-semibold">Semestr</th>
                    <th className="px-5 py-3 font-semibold">Sana oralig&apos;i</th>
                    <th className="px-5 py-3 font-semibold">Holat</th>
                    <th className="px-5 py-3 font-semibold">Sessiyalar</th>
                  </>
                )}
                <th className="px-5 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {tab === "faculties"
                ? faculties.map((faculty, index) => (
                    <tr
                      key={faculty.id}
                      className="animate-fade-up border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-brand-50/40"
                      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-600 text-[11px] font-semibold uppercase text-white shadow-sm">
                            {initials(faculty.name)}
                          </span>
                          <span className="font-medium text-slate-900">{faculty.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {faculty.code ? (
                          <Badge tone="slate" className="font-mono">
                            {faculty.code}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={faculty.groupsCount > 0 ? "blue" : "slate"} className="gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 2 9 5-9 5-9-5 9-5" />
                            <path d="m3 12 9 5 9-5" />
                            <path d="m3 17 9 5 9-5" />
                          </svg>
                          {faculty.groupsCount} ta guruh
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => openAssignment(faculty)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            Guruhlar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openEditFaculty(faculty)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                            </svg>
                            Tahrirlash
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() =>
                              void remove(
                                `/api/admin/faculties/${faculty.id}`,
                                `"${faculty.name}" fakulteti o'chirilsinmi?`,
                                "Fakultet o'chirildi",
                              )
                            }
                          >
                            O&apos;chirish
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                : terms.map((term, index) => {
                    const progress = termProgress(term.startDate, term.endDate);
                    return (
                      <tr
                        key={term.id}
                        className={cn(
                          "animate-fade-up border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-brand-50/40",
                          term.isActive && "bg-emerald-50/40",
                        )}
                        style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                                term.isActive ? "from-emerald-500 to-emerald-700" : "from-slate-400 to-slate-600",
                              )}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                              </svg>
                            </span>
                            <span className="font-medium text-slate-900">{term.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="min-w-44 space-y-1.5">
                            <p className="text-sm font-medium tabular-nums text-slate-700">
                              {formatDate(term.startDate)} — {formatDate(term.endDate)}
                            </p>
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={cn(
                                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                                    term.isActive ? "from-emerald-400 to-emerald-600" : "from-brand-500 to-brand-900",
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-slate-400">{progress}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {term.isActive ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                              </span>
                              Aktiv
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                              <span className="size-2 rounded-full bg-slate-300" />
                              Nofaol
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={term.sessionsCount > 0 ? "purple" : "slate"}>
                            {term.sessionsCount} ta sessiya
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1.5">
                            {!term.isActive ? (
                              <Button
                                size="sm"
                                variant="gold"
                                disabled={busy}
                                onClick={() => void activateTerm(term)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                                </svg>
                                Aktiv qilish
                              </Button>
                            ) : null}
                            <Button size="sm" variant="secondary" onClick={() => openEditTerm(term)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                              </svg>
                              Tahrirlash
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() =>
                                void remove(
                                  `/api/admin/terms/${term.id}`,
                                  `"${term.name}" semestri o'chirilsinmi?`,
                                  "Semestr o'chirildi",
                                )
                              }
                            >
                              O&apos;chirish
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </Table>
        )}
      </Card>

      {assignment ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Guruhlarni biriktirish"
        >
          <button
            type="button"
            aria-label="Panelni yopish"
            onClick={() => setAssignment(null)}
            className="animate-fade-in absolute inset-0 cursor-default bg-slate-900/45 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)]">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400" />
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 2 9 5-9 5-9-5 9-5" />
                      <path d="m3 12 9 5 9-5" />
                      <path d="m3 17 9 5 9-5" />
                    </svg>
                  </span>
                  Guruhlarni biriktirish
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                  <span className="inline-flex size-5 items-center justify-center rounded-md bg-gradient-to-br from-brand-800 to-brand-600 text-[9px] font-semibold uppercase text-white">
                    {initials(assignment.name)}
                  </span>
                  {assignment.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignment(null)}
                aria-label="Yopish"
                className="rounded-lg p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 border-b border-slate-100 px-5 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
                <Input
                  value={groupQuery}
                  onChange={(event) => setGroupQuery(event.target.value)}
                  placeholder="Guruh qidirish..."
                  className="pl-9"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  {filteredGroups.length} ta guruh ko&apos;rsatilmoqda
                </span>
                <span className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={filteredGroups.length === 0}
                    onClick={() =>
                      setAssignmentIds((ids) => Array.from(new Set([...ids, ...filteredGroups.map((group) => group.id)])))
                    }
                  >
                    Hammasini tanlash
                  </Button>
                  <Button size="sm" variant="ghost" disabled={assignmentIds.length === 0} onClick={() => setAssignmentIds([])}>
                    Tozalash
                  </Button>
                </span>
              </div>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto px-3 py-3">
              {groups.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">Guruhlar topilmadi</p>
              ) : filteredGroups.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  &quot;{groupQuery.trim()}&quot; bo&apos;yicha guruh topilmadi
                </p>
              ) : (
                filteredGroups.map((group) => {
                  const checked = assignmentIds.includes(group.id);
                  const otherFaculty =
                    group.facultyId && group.facultyId !== assignment.id
                      ? facultyNameById.get(group.facultyId) ?? null
                      : null;
                  return (
                    <label
                      key={group.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
                        checked
                          ? "border-brand-200 bg-brand-50/70 shadow-[0_1px_2px_rgba(29,52,96,0.06)]"
                          : "border-transparent hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroup(group.id)}
                        className="size-4 shrink-0 rounded border-slate-300 accent-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{group.name}</span>
                        <span className="block truncate text-xs text-slate-400">{group.userCount} ta a&apos;zo</span>
                      </span>
                      {otherFaculty ? (
                        <Badge tone="amber" className="shrink-0">
                          {otherFaculty}
                        </Badge>
                      ) : null}
                      {checked ? (
                        <svg
                          className="shrink-0 text-brand-600"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : null}
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-xs font-medium text-slate-500">
                <Badge tone={assignmentIds.length > 0 ? "blue" : "slate"}>{assignmentIds.length} ta tanlandi</Badge>
              </span>
              <span className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAssignment(null)}>
                  Bekor qilish
                </Button>
                <Button size="sm" onClick={() => void saveAssignment()} disabled={busy}>
                  {busy ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
