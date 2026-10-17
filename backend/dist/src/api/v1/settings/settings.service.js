import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../../../config/env.js';
import { isRedisEnabled, cacheDel, cacheDelByPrefix } from '../../../core/cache/redis.js';
import { CACHE_KEYS, LEGACY_NAV_KEYS } from '../../../core/cache/keys.js';
import { UserModel } from '../users/user.model.js';
import { ProductModel } from '../products/product.model.js';
import { OrderModel } from '../orders/order.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { PageModel } from '../cms/page.model.js';
import { AuditLogModel } from '../audit-logs/audit-log.model.js';
import { SystemSettingsModel } from './settings.model.js';
const DEFAULT_ZONES = [
    { name: 'Dhaka City', areas: 'Dhaka metro', rate: 60, estimatedDays: '1-2' },
    { name: 'Outside Dhaka', areas: 'All other districts', rate: 120, estimatedDays: '2-5' },
];
export const settingsWriteSchema = z.object({
    general: z
        .object({
        siteName: z.string().trim().max(120).optional(),
        logo: z.string().optional(),
        favicon: z.string().optional(),
        contactEmail: z.string().trim().email().or(z.literal('')).optional(),
        phone: z.string().trim().max(40).optional(),
        address: z.string().trim().max(300).optional(),
    })
        .optional(),
    payment: z
        .object({
        methods: z
            .object({
            cod: z.boolean().optional(),
            bkash: z.boolean().optional(),
            nagad: z.boolean().optional(),
            card: z.boolean().optional(),
        })
            .optional(),
        bkashNumber: z.string().optional(),
        nagadNumber: z.string().optional(),
    })
        .optional(),
    shipping: z
        .object({
        freeShippingThreshold: z.coerce.number().min(0).optional(),
        defaultRate: z.coerce.number().min(0).optional(),
        zones: z
            .array(z.object({
            _id: z.string().optional(),
            name: z.string().trim().min(1),
            areas: z.string().optional().default(''),
            rate: z.coerce.number().min(0),
            estimatedDays: z.string().optional().default('2-5'),
        }))
            .optional(),
    })
        .optional(),
    tax: z
        .object({
        enabled: z.boolean().optional(),
        rate: z.coerce.number().min(0).max(100).optional(),
        label: z.string().trim().max(40).optional(),
    })
        .optional(),
    email: z
        .object({
        smtpHost: z.string().optional(),
        smtpPort: z.coerce.number().optional(),
        smtpUser: z.string().optional(),
        smtpPass: z.string().optional(),
        fromEmail: z.string().optional(),
        fromName: z.string().optional(),
        orderTemplate: z.string().optional(),
        welcomeTemplate: z.string().optional(),
    })
        .optional(),
    seo: z
        .object({
        defaultMetaTitle: z.string().optional(),
        defaultMetaDescription: z.string().optional(),
        googleAnalyticsId: z.string().optional(),
        facebookPixelId: z.string().optional(),
    })
        .optional(),
    security: z
        .object({
        twoFactorOptional: z.boolean().optional(),
        loginAttemptsLimit: z.coerce.number().min(1).max(50).optional(),
        sessionTimeoutMinutes: z.coerce.number().min(5).max(10080).optional(),
        requireStrongPasswords: z.boolean().optional(),
    })
        .optional(),
    maintenance: z
        .object({
        autoBackupEnabled: z.boolean().optional(),
        autoBackupCron: z.string().optional(),
    })
        .optional(),
});
export const ensureSystemSettings = async () => {
    let doc = await SystemSettingsModel.findOne({ key: 'default' });
    if (!doc) {
        doc = await SystemSettingsModel.create({
            key: 'default',
            shipping: { freeShippingThreshold: 5000, defaultRate: 100, zones: DEFAULT_ZONES },
        });
    }
    return doc;
};
export const getSystemSettings = async () => {
    const doc = await ensureSystemSettings();
    const lean = doc.toObject ? doc.toObject() : doc;
    if (lean?.email?.smtpPass)
        lean.email.smtpPass = lean.email.smtpPass ? '********' : '';
    return lean;
};
export const updateSystemSettings = async (payload) => {
    await ensureSystemSettings();
    const $set = {};
    const sections = ['general', 'payment', 'shipping', 'tax', 'email', 'seo', 'security', 'maintenance'];
    for (const section of sections) {
        const value = payload[section];
        if (!value)
            continue;
        Object.entries(value).forEach(([key, nested]) => {
            if (key === 'smtpPass' && (nested === '********' || nested === ''))
                return;
            $set[`${section}.${key}`] = nested;
        });
    }
    const doc = await SystemSettingsModel.findOneAndUpdate({ key: 'default' }, { $set }, { new: true });
    return getSystemSettings();
};
export const flushApplicationCache = async () => {
    await cacheDel(CACHE_KEYS.CATEGORIES_TREE, CACHE_KEYS.CATEGORIES_NAV, CACHE_KEYS.CATEGORIES_FOOTER, CACHE_KEYS.PRODUCTS_FEATURED, CACHE_KEYS.PRODUCTS_NEW, ...LEGACY_NAV_KEYS);
    await cacheDelByPrefix('products:detail:');
    return { cleared: true, redis: isRedisEnabled() };
};
export const getSystemHealth = async () => {
    const mongoState = mongoose.connection.readyState;
    const mongoOk = mongoState === 1;
    let mongoLatencyMs = null;
    if (mongoOk) {
        const started = Date.now();
        await mongoose.connection.db?.admin().ping();
        mongoLatencyMs = Date.now() - started;
    }
    const [users, products, orders, lowStock] = await Promise.all([
        UserModel.countDocuments(),
        ProductModel.countDocuments({ status: { $ne: 'archived' } }),
        OrderModel.countDocuments(),
        ProductModel.countDocuments({ status: 'active', stockStatus: { $in: ['low_stock', 'out_of_stock'] } }),
    ]);
    return {
        status: mongoOk ? 'ok' : 'degraded',
        service: 'scaffold-backend',
        uptimeSec: Math.round(process.uptime()),
        nodeEnv: config.NODE_ENV,
        mongo: { ok: mongoOk, latencyMs: mongoLatencyMs, state: mongoState },
        redis: { ok: isRedisEnabled(), enabled: Boolean(config.REDIS_URL) },
        counts: { users, products, orders, lowStock },
        checkedAt: new Date().toISOString(),
    };
};
const backupsDir = () => path.join(process.cwd(), 'uploads', 'backups');
export const createDatabaseBackup = async () => {
    await fs.mkdir(backupsDir(), { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${stamp}.json`;
    const filePath = path.join(backupsDir(), filename);
    const [users, products, categories, orders, pages, settings] = await Promise.all([
        UserModel.find().select('-password -refreshTokenHash').lean(),
        ProductModel.find().lean(),
        CategoryModel.find().lean(),
        OrderModel.find().lean(),
        PageModel.find().lean(),
        SystemSettingsModel.find().lean(),
    ]);
    const payload = {
        version: 1,
        createdAt: new Date().toISOString(),
        collections: { users, products, categories, orders, pages, settings },
    };
    await fs.writeFile(filePath, JSON.stringify(payload), 'utf8');
    await SystemSettingsModel.updateOne({ key: 'default' }, { $set: { 'maintenance.lastBackupAt': new Date(), 'maintenance.lastBackupFile': filename } });
    return {
        filename,
        path: `/uploads/backups/${filename}`,
        size: Buffer.byteLength(JSON.stringify(payload)),
        createdAt: payload.createdAt,
    };
};
export const listBackups = async () => {
    await fs.mkdir(backupsDir(), { recursive: true });
    const files = await fs.readdir(backupsDir());
    const rows = await Promise.all(files
        .filter((name) => name.endsWith('.json'))
        .map(async (name) => {
        const stat = await fs.stat(path.join(backupsDir(), name));
        return {
            filename: name,
            path: `/uploads/backups/${name}`,
            size: stat.size,
            createdAt: stat.mtime.toISOString(),
        };
    }));
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
export const activityQuerySchema = z.object({
    search: z.string().trim().max(120).optional(),
    action: z.string().trim().max(80).optional(),
    actorEmail: z.string().trim().max(160).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
const buildActivityFilter = (query) => {
    const filter = {};
    if (query.action)
        filter.action = { $regex: query.action, $options: 'i' };
    if (query.actorEmail)
        filter.actorEmail = { $regex: query.actorEmail, $options: 'i' };
    if (query.search) {
        const pattern = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ action: pattern }, { actorEmail: pattern }, { targetType: pattern }];
    }
    if (query.from || query.to) {
        filter.createdAt = {};
        if (query.from)
            filter.createdAt.$gte = new Date(query.from);
        if (query.to) {
            const end = new Date(query.to);
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }
    return filter;
};
export const listActivityLogs = async (raw) => {
    const query = activityQuerySchema.parse(raw);
    const filter = buildActivityFilter(query);
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
        AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
        AuditLogModel.countDocuments(filter),
    ]);
    return {
        items,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
};
export const exportActivityLogsCsv = async (raw) => {
    const data = await listActivityLogs({ ...raw, page: 1, limit: 500 });
    const headers = ['createdAt', 'actorEmail', 'action', 'targetType', 'targetId', 'requestId'];
    const rows = data.items.map((item) => [item.createdAt, item.actorEmail, item.action, item.targetType || '', item.targetId || '', item.requestId || '']
        .map((value) => {
        const text = String(value ?? '');
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
        .join(','));
    return { filename: 'activity-logs.csv', csv: [headers.join(','), ...rows].join('\n'), total: data.items.length };
};
export const listAdminAccounts = async () => {
    const users = await UserModel.find({
        role: { $in: ['store_admin', 'platform_admin', 'platform_super_admin', 'platform_support'] },
    })
        .select('-password -refreshTokenHash')
        .sort({ createdAt: -1 })
        .lean();
    return users;
};
