import { createClient, type RedisClientType } from "redis";

import env from "@/lib/config/env";

type CacheRecord = {
  payload: string;
  expiresAt: number;
  syncedAt: string;
};

type CacheResult<T> = {
  data: T;
  stale: boolean;
  syncedAt: string;
};

const memoryCache = new Map<string, CacheRecord>();

declare global {
  var __interDailyRedisClient: RedisClientType | undefined;
}

async function getRedisClient() {
  if (!env.redisUrl) {
    return null;
  }

  if (!global.__interDailyRedisClient) {
    global.__interDailyRedisClient = createClient({ url: env.redisUrl });
    global.__interDailyRedisClient.on("error", () => {
      // Redis errors are tolerated because the app can fall back to memory cache.
    });
  }

  if (!global.__interDailyRedisClient.isOpen) {
    await global.__interDailyRedisClient.connect();
  }

  return global.__interDailyRedisClient;
}

async function readRecord(key: string) {
  const redis = await getRedisClient();

  if (redis) {
    const raw = await redis.get(key);
    if (raw) {
      return JSON.parse(raw) as CacheRecord;
    }
  }

  return memoryCache.get(key) ?? null;
}

async function writeRecord(key: string, record: CacheRecord) {
  const redis = await getRedisClient();

  if (redis) {
    await redis.set(key, JSON.stringify(record), {
      expiration: {
        type: "EX",
        value: Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000))
      }
    });
  }

  memoryCache.set(key, record);
}

export async function primeCacheValue<T>(key: string, ttlSeconds: number, data: T, syncedAt = new Date().toISOString()) {
  await writeRecord(key, {
    payload: JSON.stringify(data),
    expiresAt: Date.now() + ttlSeconds * 1000,
    syncedAt
  });
}

export async function getCachedOrLoad<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<CacheResult<T>> {
  const now = Date.now();
  const current = await readRecord(key);

  if (current && current.expiresAt > now) {
    return {
      data: JSON.parse(current.payload) as T,
      stale: false,
      syncedAt: current.syncedAt
    };
  }

  try {
    const data = await loader();
    const syncedAt = new Date().toISOString();
    await writeRecord(key, {
      payload: JSON.stringify(data),
      expiresAt: now + ttlSeconds * 1000,
      syncedAt
    });

    return { data, stale: false, syncedAt };
  } catch (error) {
    if (current) {
      return {
        data: JSON.parse(current.payload) as T,
        stale: true,
        syncedAt: current.syncedAt
      };
    }

    throw error;
  }
}
