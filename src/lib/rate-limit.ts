import "server-only";
import Redis, { RedisOptions } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const RETRY_COOLDOWN_MS = 30_000;

let redis: Redis | null = null;
let redisRetryAt = 0;
let connectPromise: Promise<void> | null = null;

const memoryStore = new Map<string, number[]>();

function disableRedis(reason: unknown) {
  redisRetryAt = Date.now() + RETRY_COOLDOWN_MS;
  if (reason) console.error("Redis unavailable, memory rate-limit ishlatiladi:", reason);
}

function getRedis() {
  if (Date.now() < redisRetryAt) return null;
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null,
    } as RedisOptions);
    redis.on("error", (error) => {
      disableRedis(error instanceof Error ? error.message : "connection error");
    });
  }
  return redis;
}

async function ensureConnected(client: Redis) {
  if (client.status === "ready") return;
  if (connectPromise) return connectPromise;
  connectPromise = (async () => {
    if (client.status === "wait" || client.status === "end") {
      await client.connect();
    }
    if (client.status !== "ready") {
      throw new Error("Redis unavailable");
    }
  })();
  try {
    await connectPromise;
  } finally {
    connectPromise = null;
  }
}

function pruneMemory() {
  if (memoryStore.size < 500) return;
  const now = Date.now();
  for (const [key, entries] of memoryStore) {
    const recent = entries.filter((time) => now - time < 60 * 60 * 1000);
    if (recent.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, recent);
    }
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

function memoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  pruneMemory();
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const entries = (memoryStore.get(key) ?? []).filter((time) => time > windowStart);
  entries.push(now);
  const totalAttempts = entries.length;
  const allowed = totalAttempts <= config.maxAttempts;
  if (!allowed) {
    entries.pop();
  }
  memoryStore.set(key, entries);
  const resetAt = entries.length > 0 ? entries[0] + config.windowMs : now + config.windowMs;
  return {
    allowed,
    remaining: Math.max(0, config.maxAttempts - entries.length),
    resetAt,
    totalAttempts,
  };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (client) {
    try {
      await ensureConnected(client);

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

      const oldestEntry = (await client.zrange(redisKey, "0", "0", "WITHSCORES")) as string[];
      const resetAt =
        oldestEntry.length >= 2
          ? parseInt(oldestEntry[1], 10) + config.windowMs
          : now + config.windowMs;

      if (!allowed) {
        await client.zrem(redisKey, String(now));
      }

      return { allowed, remaining, resetAt, totalAttempts };
    } catch (error) {
      disableRedis(error);
    }
  }
  return memoryCheck(`${config.keyPrefix || "ratelimit"}:${key}`, config);
}

export async function clearRateLimit(key: string, keyPrefix?: string): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      await ensureConnected(client);
      await client.del(`${keyPrefix || "ratelimit"}:${key}`);
      return;
    } catch (error) {
      disableRedis(error);
    }
  }
  memoryStore.delete(`${keyPrefix || "ratelimit"}:${key}`);
}

export async function getRateLimitInfo(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (client) {
    try {
      await ensureConnected(client);

      const prefix = config.keyPrefix || "ratelimit";
      const redisKey = `${prefix}:${key}`;
      const windowStart = Date.now() - config.windowMs;

      await client.zremrangebyscore(redisKey, 0, windowStart);
      const totalAttempts = await client.zcard(redisKey);
      const allowed = totalAttempts <= config.maxAttempts;
      const remaining = Math.max(0, config.maxAttempts - totalAttempts);

      const oldestEntry = (await client.zrange(redisKey, "0", "0", "WITHSCORES")) as string[];
      const resetAt =
        oldestEntry.length >= 2
          ? parseInt(oldestEntry[1], 10) + config.windowMs
          : Date.now() + config.windowMs;

      return { allowed, remaining, resetAt, totalAttempts };
    } catch (error) {
      disableRedis(error);
    }
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const entries = (memoryStore.get(`${config.keyPrefix || "ratelimit"}:${key}`) ?? []).filter(
    (time) => time > windowStart,
  );
  const totalAttempts = entries.length;
  return {
    allowed: totalAttempts <= config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - totalAttempts),
    resetAt: entries.length > 0 ? entries[0] + config.windowMs : now + config.windowMs,
    totalAttempts,
  };
}
