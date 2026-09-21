import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog, getClientInfo } from "@/lib/audit";

const MIME_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  zip: "application/zip",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function uploadBaseDir() {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

function isSafePath(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const clientInfo = getClientInfo(request);
  const user = await getCurrentUser();
  if (!user) {
    await createAuditLog({
      action: "FILE_DOWNLOAD",
      meta: { reason: "unauthorized" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return new Response("Unauthorized", { status: 401 });
  }

  const { path: segments } = await params;
  if (
    !segments?.length ||
    segments.some((segment) => segment === ".." || segment.includes("/") || segment.includes("\\"))
  ) {
    return new Response("Not found", { status: 404 });
  }

  const baseDir = uploadBaseDir();
  const requestedPath = path.join(baseDir, ...segments);

  if (!isSafePath(baseDir, requestedPath)) {
    await createAuditLog({
      action: "FILE_DOWNLOAD",
      entity: "File",
      meta: { requestedPath: segments.join("/"), reason: "path_traversal_attempt" },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(requestedPath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const data = await readFile(requestedPath);
    const extension = requestedPath.split(".").pop()?.toLowerCase() ?? "";
    const fileName = segments[segments.length - 1];
    await createAuditLog({
      action: "FILE_DOWNLOAD",
      entity: "File",
      entityId: fileName,
      meta: { extension, size: info.size, downloadedBy: user.id },
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}