import IORedis from 'ioredis';
import { config } from '../../config/env.js';
const RedisCtor = IORedis;
const memoryCache = new Map();
let client = null;
let redisReady = false;
const isExpired = (entry) => entry.expiresAt > 0 && Date.now() > entry.expiresAt;
export const connectRedis = async () => {
    if (!config.REDIS_URL || client)
        return;
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
    }
    catch (err) {
        redisReady = false;
        client = null;
        const message = err instanceof Error ? err.message : 'unknown error';
        console.warn(`Redis unavailable (${message}), using in-memory cache`);
    }
};
export const cacheGet = async (key) => {
    if (redisReady && client) {
        try {
            return await client.get(key);
        }
        catch {
            redisReady = false;
        }
    }
    const entry = memoryCache.get(key);
    if (!entry)
        return null;
    if (isExpired(entry)) {
        memoryCache.delete(key);
        return null;
    }
    return entry.value;
};
export const cacheSet = async (key, value, ttlSeconds) => {
    if (redisReady && client) {
        try {
            await client.set(key, value, 'EX', ttlSeconds);
            return;
        }
        catch {
            redisReady = false;
        }
    }
    memoryCache.set(key, {
        value,
        expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
    });
};
export const cacheDel = async (...keys) => {
    const unique = [...new Set(keys.filter(Boolean))];
    if (!unique.length)
        return;
    if (redisReady && client) {
        try {
            await client.del(...unique);
        }
        catch {
            redisReady = false;
        }
    }
    unique.forEach((key) => memoryCache.delete(key));
};
export const cacheDelByPrefix = async (prefix) => {
    if (!prefix)
        return;
    if (redisReady && client) {
        try {
            const keys = await client.keys(`${prefix}*`);
            if (keys.length)
                await client.del(...keys);
        }
        catch {
            redisReady = false;
        }
    }
    for (const key of [...memoryCache.keys()]) {
        if (key.startsWith(prefix))
            memoryCache.delete(key);
    }
};
export const cacheGetJson = async (key) => {
    const raw = await cacheGet(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        await cacheDel(key);
        return null;
    }
};
export const cacheSetJson = async (key, value, ttlSeconds) => {
    await cacheSet(key, JSON.stringify(value), ttlSeconds);
};
export const cacheReadThrough = async (key, ttlSeconds, factory) => {
    const cached = await cacheGetJson(key);
    if (cached !== null)
        return cached;
    const value = await factory();
    await cacheSetJson(key, value, ttlSeconds);
    return value;
};
export const isRedisEnabled = () => redisReady;
