import type { GeoPoint, QrTokenPayload } from "./types";

export async function signQrToken(_input: {
  sessionId: string;
  courseId: string;
  location?: GeoPoint;
}): Promise<string> {
  throw new Error("qr-token: not implemented");
}

export async function verifyQrToken(_token: string): Promise<QrTokenPayload | null> {
  throw new Error("qr-token: not implemented");
}

export function checkInUrl(_origin: string, _token: string): string {
  throw new Error("qr-token: not implemented");
}
