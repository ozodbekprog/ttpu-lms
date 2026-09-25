export const QR_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const QR_CODE_LENGTH = 6;

export function normalizeQrCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, QR_CODE_LENGTH);
}

export function generateQrCode(random: (max: number) => number): string {
  let code = "";
  for (let index = 0; index < QR_CODE_LENGTH; index += 1) {
    code += QR_CODE_ALPHABET[random(QR_CODE_ALPHABET.length)];
  }
  return code;
}

export function isSessionActive(expiresAt: Date | string, now: number = Date.now()): boolean {
  const time = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return time > now;
}

export function sessionProgress(
  createdAt: Date | string,
  expiresAt: Date | string,
  now: number = Date.now(),
): number {
  const created = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  const expires = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  const total = expires - created;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, (expires - now) / total));
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
