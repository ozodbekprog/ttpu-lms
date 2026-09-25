export const QR_TOKEN_TTL_SECONDS = Number(process.env.QR_TOKEN_TTL_S ?? 10);
export const QR_TOKEN_GRACE_SECONDS = Number(process.env.QR_TOKEN_GRACE_S ?? 10);
export const QR_GEO_RADIUS_M = Number(process.env.QR_GEO_RADIUS_M ?? 200);
export const QR_GEO_ACCURACY_LIMIT_M = Number(process.env.QR_GEO_ACCURACY_M ?? 300);
export const QR_IP_GEO_MAX_KM = Number(process.env.QR_IP_GEO_MAX_KM ?? 100);
export const QR_IP_LOOKUP_TIMEOUT_MS = Number(process.env.QR_IP_LOOKUP_TIMEOUT_MS ?? 3000);
