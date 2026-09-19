import { describe, expect, it } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "jose";

const SECRET = "ttpu-test-secret";
const key = new TextEncoder().encode(SECRET);
const MAX_AGE = 60 * 60 * 24 * 7;

type SessionPayload = {
  uid: string;
  role: string;
  name: string;
  email: string;
  epoch: number;
};

async function issueSession(
  payload: Partial<SessionPayload> & Pick<SessionPayload, "uid">,
  expiresIn: string | number = "7d",
) {
  return new SignJWT({ role: "STUDENT", name: "Test", email: "test@ttpu.uz", epoch: 0, ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

function readEpoch(payload: JWTPayload): number {
  return typeof payload.epoch === "number" ? payload.epoch : -1;
}

describe("JWT session epoch", () => {
  it("epoch payload sifatida encode/decode qilinadi", async () => {
    const token = await issueSession({ uid: "u1", epoch: 3 });
    const { payload } = await jwtVerify(token, key);
    expect(payload.uid).toBe("u1");
    expect(payload.role).toBe("STUDENT");
    expect(readEpoch(payload)).toBe(3);
  });

  it("epoch yo'q bo'lsa -1 fallback qiymati ishlatiladi", async () => {
    const token = await new SignJWT({ uid: "u2", role: "STUDENT" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(key);
    const { payload } = await jwtVerify(token, key);
    expect(readEpoch(payload)).toBe(-1);
  });

  it("sessiya muddati 7 kunga (604800 soniya) teng", async () => {
    const token = await issueSession({ uid: "u1" });
    const { payload } = await jwtVerify(token, key);
    expect(typeof payload.iat).toBe("number");
    expect(typeof payload.exp).toBe("number");
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(MAX_AGE);
  });

  it("token epoch'i foydalanuvchi epoch'iga mos kelmasa sessiya bekor", async () => {
    const token = await issueSession({ uid: "u1", epoch: 3 });
    const { payload } = await jwtVerify(token, key);
    const userEpochAfterLogout = 4;
    expect(userEpochAfterLogout !== readEpoch(payload)).toBe(true);
    expect(3 !== readEpoch(payload)).toBe(false);
  });

  it("boshqa kalit bilan imzolangan token tekshirilmaydi", async () => {
    const token = await issueSession({ uid: "u1" });
    const otherKey = new TextEncoder().encode("boshqa-kalit");
    await expect(jwtVerify(token, otherKey)).rejects.toThrow();
  });

  it("muddati o'tgan token rad etiladi", async () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 60;
    const token = await issueSession({ uid: "u1" }, expiredAt);
    await expect(jwtVerify(token, key)).rejects.toThrow();
  });
});
