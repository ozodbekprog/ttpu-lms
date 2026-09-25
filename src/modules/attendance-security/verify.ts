import type { CheckInRiskInput, GeoPoint, IpGeo, RiskResult } from "./types";

export function haversineMeters(_a: GeoPoint, _b: GeoPoint): number {
  throw new Error("verify: not implemented");
}

export function clientIpFromHeaders(_headers: Headers): string | null {
  throw new Error("verify: not implemented");
}

export async function lookupIpGeo(_ip: string): Promise<IpGeo | null> {
  throw new Error("verify: not implemented");
}

export async function evaluateCheckInRisk(_input: CheckInRiskInput): Promise<RiskResult> {
  throw new Error("verify: not implemented");
}
