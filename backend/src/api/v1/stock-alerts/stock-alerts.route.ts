import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth } from '../../../core/auth/middleware.js';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { verifyAccessToken } from '../../../core/auth/jwt.js';
import { ProductModel } from '../products/product.model.js';
import { StockAlertModel } from './stock-alert.model.js';
import { UserModel } from '../users/user.model.js';
import { auditLog } from '../../../core/logging/audit.js';

const subscribeSchema = z.object({
  productId: z.string().min(1),
  email: z.string().email().optional(),
});

export const stockAlertsRouter = Router();

stockAlertsRouter.use((req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.auth = verifyAccessToken(token);
    } catch {
      // guest subscribe allowed with email
    }
  }
  next();
});

stockAlertsRouter.post(
  '/subscribe',
  zodValidate(subscribeSchema),
  asyncHandler(async (req, res) => {
    const { productId, email: bodyEmail } = req.body as z.infer<typeof subscribeSchema>;
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new BadRequestError('Invalid product id');
    const product = await ProductModel.findById(productId).lean();
    if (!product || product.status !== 'active') throw new NotFoundError('Product not found');
    if (Number(product.stock) > 0) throw new BadRequestError('Product is already in stock');

    let email = bodyEmail?.toLowerCase();
    if (!email && req.auth?.sub) {
      const user = await UserModel.findById(req.auth.sub).select('email').lean();
      email = user?.email;
    }
    if (!email) throw new BadRequestError('Email is required to subscribe');

    const alert = await StockAlertModel.findOneAndUpdate(
      { productId, email },
      {
        productId,
        email,
        userId: req.auth?.sub || null,
        active: true,
        notifiedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (req.auth) {
      auditLog(req, { action: 'stock_alert.subscribe', targetType: 'Product', targetId: productId });
    }
    envelope.ok(res, { subscribed: true, id: alert._id, email });
  }),
);

stockAlertsRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await StockAlertModel.find({ userId: req.auth!.sub, active: true })
      .populate('productId', 'name title slug image stock stockStatus finalPrice price')
      .sort({ createdAt: -1 })
      .lean();
    envelope.ok(res, items);
  }),
);

stockAlertsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid alert id');
    await StockAlertModel.deleteOne({ _id: id, userId: req.auth!.sub });
    envelope.ok(res, { deleted: true });
  }),
);
