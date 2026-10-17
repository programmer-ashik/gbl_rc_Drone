import IORedis from 'ioredis';
import { config } from '../../config/env.js';

type MemoryEntry = { value: string; expiresAt: number };
type RedisClient = {
  on(event: string, handler: (err: Error) => void): void;
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, token: 'EX', ttl: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
};

const RedisCtor = IORedis as unknown as new (
  url: string,
  options?: Record<string, unknown>,
) => RedisClient;

const memoryCache = new Map<string, MemoryEntry>();
let client: RedisClient | null = null;
let redisReady = false;

const isExpired = (entry: MemoryEntry) => entry.expiresAt > 0 && Date.now() > entry.expiresAt;

export const connectRedis = async (): Promise<void> => {
  if (!config.REDIS_URL || client) return;

  try {
    const redis = new RedisCtor(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      redisReady = false;
      console.warn('Redis error, using in-memory cache:', err.message);
    });
    redis.on('ready', () => {
      redisReady = true;
    });
    await redis.connect();
    client = redis;
    redisReady = true;
    console.log('Redis connected');
  } catch (err) {
    redisReady = false;
    client = null;
    const message = err instanceof Error ? err.message : 'unknown error';
    console.warn(`Redis unavailable (${message}), using in-memory cache`);
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  if (redisReady && client) {
    try {
      return await client.get(key);
    } catch {
      redisReady = false;
    }
  }
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (isExpired(entry)) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const cacheSet = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  if (redisReady && client) {
    try {
      await client.set(key, value, 'EX', ttlSeconds);
      return;
    } catch {
      redisReady = false;
    }
  }
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
  });
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
  const unique = [...new Set(keys.filter(Boolean))];
  if (!unique.length) return;
  if (redisReady && client) {
    try {
      await client.del(...unique);
    } catch {
      redisReady = false;
    }
  }
  unique.forEach((key) => memoryCache.delete(key));
};

export const cacheDelByPrefix = async (prefix: string): Promise<void> => {
  if (!prefix) return;
  if (redisReady && client) {
    try {
      const keys = await client.keys(`${prefix}*`);
      if (keys.length) await client.del(...keys);
    } catch {
      redisReady = false;
    }
  }
  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
};

export const cacheGetJson = async <T>(key: string): Promise<T | null> => {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    await cacheDel(key);
    return null;
  }
};

export const cacheSetJson = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
};

export const cacheReadThrough = async <T>(
  key: string,
  ttlSeconds: number,
  factory: () => Promise<T>,
): Promise<T> => {
  const cached = await cacheGetJson<T>(key);
  if (cached !== null) return cached;
  const value = await factory();
  await cacheSetJson(key, value, ttlSeconds);
  return value;
};

export const isRedisEnabled = (): boolean => redisReady;
