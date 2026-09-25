import "server-only";
import Redis, { RedisOptions } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisPreferred = process.env.RATE_LIMIT_REDIS !== "0";

let redis: Redis | null = null;
let redisBroken = !redisPreferred;

const memoryStore = new Map<string, number[]>();

function getRedis() {
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: () => null,
    } as RedisOptions);
    redis.on("error", () => {
      redisBroken = true;
    });
  }
  return redis;
}

async function ensureConnected(): Promise<Redis | null> {
  if (redisBroken) return null;
  const client = getRedis();
  try {
    if (client.status === "wait") {
      await client.connect();
    }
    if (client.status !== "ready") {
      redisBroken = true;
      return null;
    }
    return client;
  } catch {
    redisBroken = true;
    try {
      client.disconnect();
    } catch {
      void 0;
    }
    return null;
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  totalAttempts: number;
}

function memoryPrune(key: string, windowMs: number, now: number): number[] {
  const fresh = (memoryStore.get(key) ?? []).filter((time) => time > now - windowMs);
  memoryStore.set(key, fresh);
  return fresh;
}

function checkMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const list = memoryPrune(key, config.windowMs, now);
  list.push(now);
  const totalAttempts = list.length;
  const allowed = totalAttempts <= config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - totalAttempts);
  const resetAt = (list[0] ?? now) + config.windowMs;
  if (!allowed) list.pop();
  return { allowed, remaining, resetAt, totalAttempts };
}

function memoryKeyFor(key: string, config: RateLimitConfig): string {
  return `${config.keyPrefix || "ratelimit"}:${key}`;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const client = await ensureConnected();
  if (!client) {
    return checkMemory(memoryKeyFor(key, config), config);
  }

  const prefix = config.keyPrefix || "ratelimit";
  const redisKey = `${prefix}:${key}`;
  const windowSec = Math.ceil(config.windowMs / 1000);

  const now = Date.now();
  const windowStart = now - config.windowMs;

  const multi = client.multi();
  multi.zremrangebyscore(redisKey, 0, windowStart);
  multi.zadd(redisKey, now, String(now));
  multi.zcard(redisKey);
  multi.expire(redisKey, windowSec);
  const results = await multi.exec();

  const totalAttempts = (results?.[2]?.[1] as number) || 0;
  const allowed = totalAttempts <= config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - totalAttempts);

  const oldestEntry = await client.zrange(redisKey, "0", "0", "WITHSCORES") as string[];
  const resetAt = oldestEntry.length >= 2
    ? parseInt(oldestEntry[1], 10) + config.windowMs
    : now + config.windowMs;

  if (!allowed) {
    await client.zrem(redisKey, String(now));
  }

  return { allowed, remaining, resetAt, totalAttempts };
}

export async function clearRateLimit(key: string, keyPrefix?: string): Promise<void> {
  const prefix = keyPrefix || "ratelimit";
  memoryStore.delete(`${prefix}:${key}`);
  const client = await ensureConnected();
  if (!client) return;
  await client.del(`${prefix}:${key}`);
}

export async function getRateLimitInfo(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const client = await ensureConnected();
  if (!client) {
    const now = Date.now();
    const list = memoryPrune(memoryKeyFor(key, config), config.windowMs, now);
    const totalAttempts = list.length;
    const allowed = totalAttempts <= config.maxAttempts;
    const remaining = Math.max(0, config.maxAttempts - totalAttempts);
    const resetAt = (list[0] ?? now) + config.windowMs;
    return { allowed, remaining, resetAt, totalAttempts };
  }

  const prefix = config.keyPrefix || "ratelimit";
  const redisKey = `${prefix}:${key}`;
  const windowStart = Date.now() - config.windowMs;

  await client.zremrangebyscore(redisKey, 0, windowStart);
  const totalAttempts = await client.zcard(redisKey);
  const allowed = totalAttempts <= config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - totalAttempts);

  const oldestEntry = await client.zrange(redisKey, "0", "0", "WITHSCORES") as string[];
  const resetAt = oldestEntry.length >= 2
    ? parseInt(oldestEntry[1], 10) + config.windowMs
    : Date.now() + config.windowMs;

  return { allowed, remaining, resetAt, totalAttempts };
}
