export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type QrTokenPayload = {
  sid: string;
  cid: string;
  lat?: number;
  lng?: number;
  iat: number;
  exp: number;
};

export type RiskReason =
  | "GEO_FAR"
  | "GEO_MISSING"
  | "GEO_ACCURACY_LOW"
  | "IP_CHANGED"
  | "IP_SHARED"
  | "IP_GEO_MISMATCH"
  | "VPN_SUSPECTED";

export type RiskResult = {
  suspicious: boolean;
  reasons: RiskReason[];
  distanceM?: number;
  ip?: string | null;
  detail?: Record<string, unknown>;
};

export type IpGeo = {
  ip: string;
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
  proxy?: boolean;
  hosting?: boolean;
};

export type CheckInRiskInput = {
  studentId: string;
  sessionId: string;
  courseId: string;
  tokenLocation?: GeoPoint;
  studentLocation?: GeoPoint;
  ip?: string | null;
};
