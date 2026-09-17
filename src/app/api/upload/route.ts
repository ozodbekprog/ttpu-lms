import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf", "zip", "docx", "pptx", "txt"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return Response.json({ ok: false, error: "FormData yuborilmadi" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "Fayl tanlanmagan" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ ok: false, error: "Fayl hajmi 20MB dan oshmasligi kerak" }, { status: 400 });
  }

  const extension = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return Response.json(
      { ok: false, error: "Ruxsat etilgan turlar: png, jpg, jpeg, webp, pdf, zip, docx, pptx, txt" },
      { status: 400 },
    );
  }

  const fileName = `${randomUUID().replace(/-/g, "")}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  return Response.json({ ok: true, data: { url: `/uploads/${fileName}` } });
}
