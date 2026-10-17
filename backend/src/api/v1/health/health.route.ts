import { Router } from 'express';
import { envelope } from '../../../core/http/middleware.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { getSystemHealth } from '../settings/settings.service.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const health = await getSystemHealth();
    envelope.ok(res, health);
  }),
);
