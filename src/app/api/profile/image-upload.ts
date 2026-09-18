import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

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

const SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  png: (buffer) => startsWith(buffer, [0x89, 0x50, 0x4e, 0x47]),
  jpg: (buffer) => startsWith(buffer, [0xff, 0xd8, 0xff]),
  jpeg: (buffer) => startsWith(buffer, [0xff, 0xd8, 0xff]),
  webp: isWebp,
};

type ImageField = "avatarUrl" | "coverUrl";

export async function handleProfileImageUpload(
  request: Request,
  options: { subdir: string; maxSize: number; maxSizeLabel: string; field: ImageField },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const contentLength = request.headers.get("content-length");
  const declaredSize = contentLength === null ? Number.NaN : Number(contentLength);
  if (!Number.isFinite(declaredSize) || declaredSize > options.maxSize) {
    return Response.json(
      { ok: false, error: `Fayl juda katta (maks ${options.maxSizeLabel})` },
      { status: 413 },
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return Response.json({ ok: false, error: "FormData yuborilmadi" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "Fayl tanlanmagan" }, { status: 400 });
  }

  if (file.size > options.maxSize) {
    return Response.json(
      { ok: false, error: `Fayl juda katta (maks ${options.maxSizeLabel})` },
      { status: 413 },
    );
  }

  const extension = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return Response.json(
      { ok: false, error: "Faqat png, jpg, jpeg, webp formatlar qabul qilinadi" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!SIGNATURES[extension](buffer)) {
    return Response.json({ ok: false, error: "Fayl mazmuni rasmga mos emas" }, { status: 400 });
  }

  const processed = await sharp(buffer)
    .resize(
      options.field === "avatarUrl"
        ? { width: 512, height: 512, fit: "cover" }
        : { width: 1920, fit: "inside", withoutEnlargement: true },
    )
    .webp({ quality: 82 })
    .toBuffer()
    .catch(() => null);
  if (!processed) {
    return Response.json({ ok: false, error: "Rasmni qayta ishlashda xatolik" }, { status: 400 });
  }

  const fileName = `${randomUUID().replace(/-/g, "")}.webp`;
  const baseDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "public", "uploads");
  const uploadDir = path.join(baseDir, options.subdir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), processed);

  const url = `/uploads/${options.subdir}/${fileName}`;
  if (options.field === "avatarUrl") {
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: url } });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { coverUrl: url } });
  }

  return Response.json({ ok: true, data: { url } });
}
