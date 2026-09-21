import "server-only";
import Redis, { RedisOptions } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    } as RedisOptions);
    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }
  return redis;
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

async function ensureConnected() {
  const client = getRedis();
  if (client.status === "wait") {
    await client.connect();
  }
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  await ensureConnected();
  const client = getRedis();

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
  await ensureConnected();
  const client = getRedis();
  const prefix = keyPrefix || "ratelimit";
  await client.del(`${prefix}:${key}`);
}

export async function getRateLimitInfo(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  await ensureConnected();
  const client = getRedis();

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