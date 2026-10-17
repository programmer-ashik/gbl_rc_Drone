import { Router } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { auditLog } from '../../../core/logging/audit.js';
import {
  createDatabaseBackup,
  exportActivityLogsCsv,
  flushApplicationCache,
  getSystemHealth,
  getSystemSettings,
  listActivityLogs,
  listAdminAccounts,
  listBackups,
  settingsWriteSchema,
  updateSystemSettings,
} from './settings.service.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'));

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    envelope.ok(res, await getSystemSettings());
  }),
);

settingsRouter.put(
  '/',
  zodValidate(settingsWriteSchema),
  asyncHandler(async (req, res) => {
    const settings = await updateSystemSettings(req.body);
    auditLog(req, { action: 'settings.update', targetType: 'SystemSettings', metadata: { keys: Object.keys(req.body || {}) } });
    envelope.ok(res, settings);
  }),
);

settingsRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    envelope.ok(res, await getSystemHealth());
  }),
);

settingsRouter.post(
  '/cache/flush',
  asyncHandler(async (req, res) => {
    const result = await flushApplicationCache();
    auditLog(req, { action: 'settings.cache.flush', targetType: 'Cache', metadata: result });
    envelope.ok(res, result);
  }),
);

settingsRouter.get(
  '/backups',
  asyncHandler(async (_req, res) => {
    envelope.ok(res, await listBackups());
  }),
);

settingsRouter.post(
  '/backups',
  asyncHandler(async (req, res) => {
    const backup = await createDatabaseBackup();
    auditLog(req, { action: 'settings.backup.create', targetType: 'Backup', metadata: { filename: backup.filename } });
    envelope.created(res, backup);
  }),
);

settingsRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    envelope.ok(res, await listActivityLogs(req.query as Record<string, unknown>));
  }),
);

settingsRouter.get(
  '/activity/export',
  asyncHandler(async (req, res) => {
    const file = await exportActivityLogsCsv(req.query as Record<string, unknown>);
    envelope.ok(res, file);
  }),
);

settingsRouter.get(
  '/admins',
  asyncHandler(async (_req, res) => {
    envelope.ok(res, await listAdminAccounts());
  }),
);
