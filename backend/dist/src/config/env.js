import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),
    CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
    REDIS_URL: z.string().optional(),
    NAV_CACHE_TTL: z.coerce.number().int().min(30).default(3600),
    CATEGORY_CACHE_TTL: z.coerce.number().int().min(30).default(3600),
    PRODUCT_CACHE_TTL: z.coerce.number().int().min(30).default(1800),
    ALLOW_DEV_ORG_FALLBACK: z
        .enum(['true', 'false', '1', '0', 'yes', 'no'])
        .default('false')
        .transform((v) => ['true', '1', 'yes'].includes(v.toLowerCase())),
    DEFAULT_ORG_SLUG: z.string().optional(),
    DEFAULT_ORG_ID: z.string().optional(),
    ALLOW_DEFAULT_ADMIN_SEED: z
        .enum(['true', 'false', '1', '0', 'yes', 'no'])
        .default('false')
        .transform((v) => ['true', '1', 'yes'].includes(v.toLowerCase())),
    PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
    PLATFORM_ADMIN_PASSWORD: z.string().optional(),
});
export const config = envSchema.parse(process.env);
