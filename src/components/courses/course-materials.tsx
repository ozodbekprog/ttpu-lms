"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export type MaterialTypeValue = "TEXT" | "FILE" | "VIDEO" | "LINK";

export type CourseMaterial = {
  id: string;
  title: string;
  type: MaterialTypeValue;
  content: string | null;
  fileUrl: string | null;
};

export type CourseSection = {
  id: string;
  title: string;
  materials: CourseMaterial[];
};

type Tone = "slate" | "blue" | "green" | "amber" | "rose" | "purple";
type RequestFn = (url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) => Promise<string | null>;

const MATERIAL_TYPES: MaterialTypeValue[] = ["TEXT", "LINK", "VIDEO", "FILE"];

const TYPE_LABELS: Record<MaterialTypeValue, string> = {
  TEXT: "Matn",
  LINK: "Havola",
  VIDEO: "Video",
  FILE: "Fayl",
};

const TYPE_TONES: Record<MaterialTypeValue, Tone> = {
  TEXT: "slate",
  LINK: "blue",
  VIDEO: "purple",
  FILE: "amber",
};

const TYPE_CHIPS: Record<MaterialTypeValue, string> = {
  TEXT: "bg-slate-100 text-slate-600 ring-slate-200/80",
  LINK: "bg-brand-50 text-brand-700 ring-brand-100",
  VIDEO: "bg-purple-50 text-purple-600 ring-purple-100",
  FILE: "bg-amber-50 text-amber-600 ring-amber-100",
};

function TypeIcon({ type }: { type: MaterialTypeValue }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "LINK" ? (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      ) : type === "VIDEO" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m10 8 6 4-6 4z" />
        </>
      ) : type === "FILE" ? (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </>
      ) : (
        <>
          <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
          <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </>
      )}
    </svg>
  );
}

export function CourseMaterials({
  courseId,
  sections,
  canManage,
}: {
  courseId: string;
  sections: CourseSection[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    sections[0] ? { [sections[0].id]: true } : {},
  );
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);
  const [materialForm, setMaterialForm] = useState<{ sectionId: string; material?: CourseMaterial } | null>(
    null,
  );

  async function request(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ): Promise<string | null> {
    setBusy(true);
    try {
      const res = await apiFetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        return json?.error ?? "Amalni bajarishda xatolik yuz berdi";
      }
      router.refresh();
      return null;
    } catch {
      return "Tarmoq xatosi. Qayta urinib ko'ring.";
    } finally {
      setBusy(false);
    }
  }

  async function saveSection() {
    if (!newSectionTitle.trim()) return;
    const err = await request(`/api/courses/${courseId}/sections`, "POST", {
      title: newSectionTitle,
    });
    if (err) {
      setError(err);
      return;
    }
    setNewSectionTitle("");
    setAddingSection(false);
    setError(null);
  }

  async function renameSection(id: string) {
    if (!editingSection || !editingSection.title.trim()) return;
    const err = await request(`/api/sections/${id}`, "PATCH", { title: editingSection.title });
    if (err) {
      setError(err);
      return;
    }
    setEditingSection(null);
    setError(null);
  }

  async function removeSection(id: string, title: string) {
    if (!window.confirm(`"${title}" bo'limi va uning materiallari o'chiriladi. Davom etilsinmi?`)) return;
    const err = await request(`/api/sections/${id}`, "DELETE");
    if (err) setError(err);
    else setError(null);
  }

  async function removeMaterial(id: string, title: string) {
    if (!window.confirm(`"${title}" materiali o'chirilsinmi?`)) return;
    const err = await request(`/api/materials/${id}`, "DELETE");
    if (err) setError(err);
    else setError(null);
  }

  function toggle(id: string) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
      ) : null}

      {canManage ? (
        addingSection ? (
          <Card>
            <CardBody className="flex flex-wrap items-end gap-3">
              <div className="min-w-52 flex-1">
                <Label>{"Bo'lim nomi"}</Label>
                <Input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Masalan: 3-hafta: Massivlar"
                />
              </div>
              <Button onClick={saveSection} disabled={busy || !newSectionTitle.trim()}>
                Saqlash
              </Button>
              <Button variant="secondary" onClick={() => setAddingSection(false)}>
                Bekor
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Button
            variant="secondary"
            className="w-full border-dashed py-2.5 text-slate-500 hover:border-brand-300 hover:text-brand-700"
            onClick={() => setAddingSection(true)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            {"Bo'lim qo'shish"}
          </Button>
        )
      ) : null}

      {sections.length === 0 ? (
        <EmptyState
          title="Bo'limlar yo'q"
          description={
            canManage
              ? "Kurs materiallarini bo'limlarga ajratib joylashtiring."
              : "Hozircha bu kursda materiallar mavjud emas."
          }
        />
      ) : null}

      {sections.map((section) => (
        <Card key={section.id} className="overflow-hidden transition-shadow duration-200 hover:shadow-lift">
          {editingSection?.id === section.id ? (
            <div className="flex flex-wrap items-center gap-2 px-5 py-4">
              <Input
                value={editingSection.title}
                onChange={(e) => setEditingSection({ id: section.id, title: e.target.value })}
                className="max-w-md"
              />
              <Button size="sm" onClick={() => renameSection(section.id)} disabled={busy}>
                Saqlash
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingSection(null)}>
                Bekor
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-1 px-4 py-3.5 md:px-5">
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/70 text-brand-700 ring-1 ring-inset ring-brand-100 transition-transform duration-200 group-hover:scale-105">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 20h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-9l-2-2H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{section.title}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-flex size-4 items-center justify-center rounded-md bg-slate-100 text-[9px] font-semibold tabular-nums text-slate-500">
                      {section.materials.length}
                    </span>
                    ta material
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                    open[section.id]
                      ? "bg-brand-50 text-brand-700"
                      : "bg-slate-100/70 text-slate-400 group-hover:bg-slate-100",
                  )}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("transition-transform duration-200", open[section.id] ? "rotate-180" : undefined)}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
              {canManage ? (
                <div className="flex shrink-0 items-center gap-0.5 md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingSection({ id: section.id, title: section.title })}
                  >
                    Tahrir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={() => removeSection(section.id, section.title)}
                  >
                    {"O'chirish"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {open[section.id] ? (
            <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-4 py-4 md:px-5">
              {section.materials.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-3">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <TypeIcon type="TEXT" />
                  </span>
                  <p className="text-sm text-slate-400">Hozircha material qo&apos;shilmagan.</p>
                </div>
              ) : null}

              {section.materials.map((material) => (
                <MaterialRow
                  key={material.id}
                  material={material}
                  canManage={canManage}
                  busy={busy}
                  onEdit={() => setMaterialForm({ sectionId: section.id, material })}
                  onDelete={() => removeMaterial(material.id, material.title)}
                />
              ))}

              {canManage && materialForm?.sectionId === section.id ? (
                <MaterialEditor
                  sectionId={section.id}
                  material={materialForm.material}
                  busy={busy}
                  request={request}
                  onClose={() => setMaterialForm(null)}
                />
              ) : null}

              {canManage && materialForm?.sectionId !== section.id ? (
                <button
                  type="button"
                  onClick={() => setMaterialForm({ sectionId: section.id })}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors duration-150 hover:border-brand-300 hover:text-brand-700"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  {"Material qo'shish"}
                </button>
              ) : null}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function MaterialRow({
  material,
  canManage,
  busy,
  onEdit,
  onDelete,
}: {
  material: CourseMaterial;
  canManage: boolean;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const href = material.type === "FILE" ? material.fileUrl : material.content;
  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-all duration-200 hover:border-brand-100 hover:shadow-sm">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
            TYPE_CHIPS[material.type],
          )}
        >
          <TypeIcon type={material.type} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-900">{material.title}</span>
            <Badge tone={TYPE_TONES[material.type]}>{TYPE_LABELS[material.type]}</Badge>
          </div>
          {material.type === "TEXT" ? (
            material.content ? (
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {material.content}
              </p>
            ) : null
          ) : href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm text-brand-700 transition-colors duration-150 hover:text-brand-900 hover:underline"
            >
              <span className="truncate">{href}</span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </a>
          ) : null}
        </div>
      </div>
      {canManage ? (
        <div className="flex shrink-0 items-center gap-0.5 md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button size="sm" variant="ghost" disabled={busy} onClick={onEdit}>
            Tahrir
          </Button>
          <Button size="sm" variant="ghost" className="text-rose-600" disabled={busy} onClick={onDelete}>
            {"O'chirish"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MaterialEditor({
  sectionId,
  material,
  busy,
  request,
  onClose,
}: {
  sectionId: string;
  material?: CourseMaterial;
  busy: boolean;
  request: RequestFn;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(material?.title ?? "");
  const [type, setType] = useState<MaterialTypeValue>(material?.type ?? "TEXT");
  const [content, setContent] = useState(material?.content ?? "");
  const [fileUrl, setFileUrl] = useState(material?.fileUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = type === "FILE" ? { title, type, fileUrl } : { title, type, content };
    const err = material
      ? await request(`/api/materials/${material.id}`, "PATCH", body)
      : await request(`/api/sections/${sectionId}/materials`, "POST", body);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50/50 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-inset ring-brand-100">
          <TypeIcon type={type} />
        </span>
        <p className="text-sm font-semibold text-slate-800">
          {material ? "Materialni tahrirlash" : "Yangi material"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Sarlavha</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Material nomi"
            required
            maxLength={300}
          />
        </div>
        <div>
          <Label>Turi</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as MaterialTypeValue)}>
            {MATERIAL_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          {type === "TEXT" ? (
            <>
              <Label>Matn</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Material matni"
              />
            </>
          ) : type === "FILE" ? (
            <>
              <Label>Fayl havolasi (URL)</Label>
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
              />
            </>
          ) : (
            <>
              <Label>Havola (URL)</Label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://..."
              />
            </>
          )}
        </div>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onClose}>
          Bekor
        </Button>
        <Button type="submit" size="sm" disabled={busy}>
          {material ? "Saqlash" : "Qo'shish"}
        </Button>
      </div>
    </form>
  );
}
