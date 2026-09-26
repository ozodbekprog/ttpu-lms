import { createHmac, timingSafeEqual } from "node:crypto";
import { QR_TOKEN_GRACE_SECONDS, QR_TOKEN_TTL_SECONDS } from "./config";
import type { GeoPoint, QrTokenPayload } from "./types";

const TOKEN_PREFIX = "v1";

function getSecret(): string {
  const secret = process.env.QR_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("QR_TOKEN_SECRET sozlanmagan");
  return secret;
}

function encodePayload(payload: QrTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signatureFor(payloadB64: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`${TOKEN_PREFIX}.${payloadB64}`).digest();
}

function isQrTokenPayload(value: unknown): value is QrTokenPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.sid !== "string" || typeof record.cid !== "string") return false;
  if (typeof record.iat !== "number" || typeof record.exp !== "number") return false;
  if (record.lat !== undefined && typeof record.lat !== "number") return false;
  if (record.lng !== undefined && typeof record.lng !== "number") return false;
  return true;
}

export async function signQrToken(input: {
  sessionId: string;
  courseId: string;
  location?: GeoPoint;
}): Promise<string> {
  const secret = getSecret();
  const iat = Math.floor(Date.now() / 1000);
  const payload: QrTokenPayload = {
    sid: input.sessionId,
    cid: input.courseId,
    iat,
    exp: iat + QR_TOKEN_TTL_SECONDS,
  };
  if (input.location?.lat !== undefined) payload.lat = input.location.lat;
  if (input.location?.lng !== undefined) payload.lng = input.location.lng;
  const payloadB64 = encodePayload(payload);
  const signature = signatureFor(payloadB64, secret).toString("base64url");
  return `${TOKEN_PREFIX}.${payloadB64}.${signature}`;
}

export async function verifyQrToken(token: string): Promise<QrTokenPayload | null> {
  try {
    const secret = process.env.QR_TOKEN_SECRET || process.env.AUTH_SECRET;
    if (!secret || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
    const payloadB64 = parts[1];
    const signatureB64 = parts[2];
    if (!payloadB64 || !signatureB64) return null;
    const expected = signatureFor(payloadB64, secret);
    const actual = Buffer.from(signatureB64, "base64url");
    if (actual.length !== expected.length) return null;
    if (!timingSafeEqual(actual, expected)) return null;
    const payload: unknown = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!isQrTokenPayload(payload)) return null;
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp + QR_TOKEN_GRACE_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkInUrl(origin: string, token: string): string {
  return `${origin}/attendance/check-in?t=${encodeURIComponent(token)}`;
}
