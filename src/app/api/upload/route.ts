import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { getCurrentUser, isStaff } from "@/lib/auth";

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf", "zip", "docx", "pptx", "txt"]);

function startsWith(buffer: Buffer, bytes: number[]) {
  if (buffer.length < bytes.length) return false;
  for (let index = 0; index < bytes.length; index += 1) {
    if (buffer[index] !== bytes[index]) return false;
  }
  return true;
}

function isWebp(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function isPlainText(buffer: Buffer) {
  return !buffer.includes(0);
}

const SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  png: (buffer) => startsWith(buffer, [0x89, 0x50, 0x4e, 0x47]),
  jpg: (buffer) => startsWith(buffer, [0xff, 0xd8, 0xff]),
  jpeg: (buffer) => startsWith(buffer, [0xff, 0xd8, 0xff]),
  pdf: (buffer) => startsWith(buffer, [0x25, 0x50, 0x44, 0x46]),
  zip: (buffer) => startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]),
  docx: (buffer) => startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]),
  pptx: (buffer) => startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]),
  webp: isWebp,
  txt: isPlainText,
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isStaff(user.role)) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const contentLength = request.headers.get("content-length");
  const declaredSize = contentLength === null ? Number.NaN : Number(contentLength);
  if (!Number.isFinite(declaredSize) || declaredSize > MAX_SIZE) {
    return Response.json({ ok: false, error: "Fayl juda katta (maks 20MB)" }, { status: 413 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return Response.json({ ok: false, error: "FormData yuborilmadi" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "Fayl tanlanmagan" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ ok: false, error: "Fayl juda katta (maks 20MB)" }, { status: 413 });
  }

  const extension = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return Response.json(
      { ok: false, error: "Ruxsat etilgan turlar: png, jpg, jpeg, webp, pdf, zip, docx, pptx, txt" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!SIGNATURES[extension](buffer)) {
    return Response.json({ ok: false, error: "Fayl mazmuni kengaytmaga mos emas" }, { status: 400 });
  }

  const fileName = `${randomUUID().replace(/-/g, "")}.${extension}`;
  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return Response.json({ ok: true, data: { url: `/uploads/${fileName}` } });
}
