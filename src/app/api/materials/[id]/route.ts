import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canManageCourse, materialRuleError } from "@/components/courses/course-access";

const MATERIAL_TYPES = ["TEXT", "FILE", "VIDEO", "LINK"] as const;

const updateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  type: z.enum(MATERIAL_TYPES).optional(),
  content: z.string().trim().max(20000).nullable().optional(),
  fileUrl: z.string().trim().max(2000).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
    include: { section: { include: { course: true } } },
  });

  if (!material) {
    return Response.json({ ok: false, error: "Material topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, material.section.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Material ma'lumotlari noto'g'ri" }, { status: 400 });
  }

  const type = parsed.data.type ?? material.type;
  const content = parsed.data.content === undefined ? material.content : parsed.data.content;
  const fileUrl = parsed.data.fileUrl === undefined ? material.fileUrl : parsed.data.fileUrl;

  const ruleError = materialRuleError(type, content, fileUrl);
  if (ruleError) {
    return Response.json({ ok: false, error: ruleError }, { status: 400 });
  }

  const updated = await prisma.material.update({
    where: { id: material.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content || null } : {}),
      ...(parsed.data.fileUrl !== undefined ? { fileUrl: parsed.data.fileUrl || null } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
    },
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
    include: { section: { include: { course: true } } },
  });

  if (!material) {
    return Response.json({ ok: false, error: "Material topilmadi" }, { status: 404 });
  }
  if (!canManageCourse(user, material.section.course)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.material.delete({ where: { id: material.id } });

  return Response.json({ ok: true, data: { id: material.id } });
}
