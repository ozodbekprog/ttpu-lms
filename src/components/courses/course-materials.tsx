"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Input, Label, Select, Textarea } from "@/components/ui";

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
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
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
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {canManage ? (
        addingSection ? (
          <Card>
            <CardBody className="flex flex-wrap items-end gap-2">
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
          <Button variant="secondary" onClick={() => setAddingSection(true)}>
            {"+ Bo'lim qo'shish"}
          </Button>
        )
      ) : null}

      {sections.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-400">{"Hozircha bo'limlar yo'q."}</p>
          </CardBody>
        </Card>
      ) : null}

      {sections.map((section) => (
        <Card key={section.id}>
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
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="text-xs text-slate-400">{open[section.id] ? "▾" : "▸"}</span>
                <span className="truncate font-semibold text-slate-900">{section.title}</span>
                <Badge tone="slate">{section.materials.length} material</Badge>
              </button>
              {canManage ? (
                <div className="flex shrink-0 gap-1">
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
            <div className="space-y-3 border-t border-slate-100 px-5 py-4">
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
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setMaterialForm({ sectionId: section.id })}
                >
                  {"+ Material qo'shish"}
                </Button>
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
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-900">{material.title}</span>
            <Badge tone={TYPE_TONES[material.type]}>{TYPE_LABELS[material.type]}</Badge>
          </div>
          {material.type === "TEXT" ? (
            material.content ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{material.content}</p>
            ) : null
          ) : href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all text-sm text-blue-600 hover:underline"
            >
              {href}
            </a>
          ) : null}
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" disabled={busy} onClick={onEdit}>
              Tahrir
            </Button>
            <Button size="sm" variant="ghost" className="text-rose-600" disabled={busy} onClick={onDelete}>
              {"O'chirish"}
            </Button>
          </div>
        ) : null}
      </div>
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
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
      <div>
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
      {type === "TEXT" ? (
        <div>
          <Label>Matn</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Material matni"
          />
        </div>
      ) : type === "FILE" ? (
        <div>
          <Label>Fayl havolasi (URL)</Label>
          <Input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      ) : (
        <div>
          <Label>Havola (URL)</Label>
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://..."
          />
        </div>
      )}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {material ? "Saqlash" : "Qo'shish"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Bekor
        </Button>
      </div>
    </form>
  );
}
