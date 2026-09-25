import { prisma } from "@/lib/prisma";
import {
  QR_GEO_ACCURACY_LIMIT_M,
  QR_GEO_RADIUS_M,
  QR_IP_GEO_MAX_KM,
  QR_IP_LOOKUP_TIMEOUT_MS,
} from "./config";
import type { CheckInRiskInput, GeoPoint, IpGeo, RiskReason, RiskResult } from "./types";

const EARTH_RADIUS_M = 6_371_000;
const IP_CACHE_TTL_MS = 10 * 60 * 1000;
const IP_API_FIELDS = "status,country,city,lat,lon,proxy,hosting,query";

type IpGeoCacheEntry = {
  value: IpGeo;
  expiresAt: number;
};

type JsonRecord = Record<string, unknown>;

const ipGeoCache = new Map<string, IpGeoCacheEntry>();

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const latitudeDelta = toRadians(b.lat - a.lat);
  const longitudeDelta = toRadians(b.lng - a.lng);
  const aLatitude = toRadians(a.lat);
  const bLatitude = toRadians(b.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(aLatitude) * Math.cos(bLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const clamped = Math.min(1, Math.max(0, haversine));
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  const withoutBrackets = normalized.replace(/^\[/, "").replace(/\]$/, "");

  if (
    withoutBrackets === "localhost" ||
    withoutBrackets === "::1" ||
    withoutBrackets === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }
  if (withoutBrackets.startsWith("::ffff:")) {
    return isPrivateOrLocalIp(withoutBrackets.slice("::ffff:".length));
  }
  if (/^f[cd][0-9a-f]{2}:/.test(withoutBrackets)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(withoutBrackets)) return true;

  const parts = withoutBrackets.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    return false;
  }
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => octet > 255)) return false;
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseIpGeo(value: unknown, requestedIp: string): IpGeo | null {
  if (!isRecord(value) || value.status !== "success") return null;

  const ip = stringValue(value.query) ?? requestedIp;
  const geo: IpGeo = { ip };
  const country = stringValue(value.country);
  const city = stringValue(value.city);
  const lat = numberValue(value.lat);
  const lng = numberValue(value.lon);
  const proxy = booleanValue(value.proxy);
  const hosting = booleanValue(value.hosting);

  if (country !== undefined) geo.country = country;
  if (city !== undefined) geo.city = city;
  if (lat !== undefined) geo.lat = lat;
  if (lng !== undefined) geo.lng = lng;
  if (proxy !== undefined) geo.proxy = proxy;
  if (hosting !== undefined) geo.hosting = hosting;
  return geo;
}

export async function lookupIpGeo(ip: string): Promise<IpGeo | null> {
  const normalizedIp = ip.trim();
  if (!normalizedIp || isPrivateOrLocalIp(normalizedIp)) return null;

  const cached = ipGeoCache.get(normalizedIp);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) ipGeoCache.delete(normalizedIp);

  try {
    const response = await fetch(
      `http://ip-api.com/json/${normalizedIp}?fields=${IP_API_FIELDS}`,
      { signal: AbortSignal.timeout(QR_IP_LOOKUP_TIMEOUT_MS) },
    );
    if (response.ok === false || (typeof response.status === "number" && response.status >= 400)) {
      return null;
    }
    const value: unknown = await response.json();
    const geo = parseIpGeo(value, normalizedIp);
    if (!geo) return null;
    ipGeoCache.set(normalizedIp, {
      value: geo,
      expiresAt: Date.now() + IP_CACHE_TTL_MS,
    });
    return geo;
  } catch {
    return null;
  }
}

function metaString(meta: unknown, key: string): string | null {
  if (!isRecord(meta)) return null;
  const value = meta[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function addReason(reasons: RiskReason[], reason: RiskReason): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function startOfToday(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

export async function evaluateCheckInRisk(input: CheckInRiskInput): Promise<RiskResult> {
  const reasons: RiskReason[] = [];
  const ip = input.ip?.trim() || null;
  let distanceM: number | undefined;
  let ipGeo: IpGeo | null = null;

  if (!input.studentLocation) {
    addReason(reasons, "GEO_MISSING");
  } else if (input.tokenLocation) {
    distanceM = haversineMeters(input.tokenLocation, input.studentLocation);
    if (
      input.studentLocation.accuracy !== undefined &&
      input.studentLocation.accuracy > QR_GEO_ACCURACY_LIMIT_M
    ) {
      addReason(reasons, "GEO_ACCURACY_LOW");
    }
    if (distanceM > QR_GEO_RADIUS_M) addReason(reasons, "GEO_FAR");
  }

  if (ip && !isPrivateOrLocalIp(ip)) {
    ipGeo = await lookupIpGeo(ip);
    if (ipGeo?.proxy === true || ipGeo?.hosting === true) {
      addReason(reasons, "VPN_SUSPECTED");
    }

    if (
      ipGeo?.lat !== undefined &&
      ipGeo.lng !== undefined &&
      input.studentLocation
    ) {
      const distanceKm =
        haversineMeters(
          { lat: ipGeo.lat, lng: ipGeo.lng },
          input.studentLocation,
        ) / 1000;
      if (distanceKm > QR_IP_GEO_MAX_KM) addReason(reasons, "IP_GEO_MISMATCH");
    }

    const previous = await prisma.auditLog.findFirst({
      where: { actorId: input.studentId, action: "attendance.check-in" },
      orderBy: { createdAt: "desc" },
    });
    const previousIp = metaString(previous?.meta, "ip");
    if (previousIp && previousIp !== ip) addReason(reasons, "IP_CHANGED");

    const sharedCandidates = await prisma.auditLog.findMany({
      where: {
        action: "attendance.check-in",
        createdAt: { gte: startOfToday() },
      },
    });
    const shared = sharedCandidates.some(
      (entry) =>
        entry.actorId !== input.studentId &&
        metaString(entry.meta, "sessionId") === input.sessionId &&
        metaString(entry.meta, "ip") === ip,
    );
    if (shared) addReason(reasons, "IP_SHARED");
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    ...(distanceM === undefined ? {} : { distanceM }),
    ip,
    detail: {
      ipGeo: ipGeo
        ? {
            city: ipGeo.city,
            country: ipGeo.country,
            proxy: ipGeo.proxy,
            hosting: ipGeo.hosting,
          }
        : null,
    },
  };
}
