import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth } from '../../../core/auth/middleware.js';
import { BadRequestError, NotFoundError } from '../../../core/http/errors.js';
import { WishlistModel } from './wishlist.model.js';
import { ProductModel } from '../products/product.model.js';
import { auditLog } from '../../../core/logging/audit.js';
const addSchema = z.object({
    productId: z.string().min(1),
});
export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);
wishlistRouter.get('/', asyncHandler(async (req, res) => {
    const wishlist = await WishlistModel.findOne({ userId: req.auth.sub })
        .populate('productIds')
        .lean();
    envelope.ok(res, wishlist?.productIds ?? []);
}));
wishlistRouter.post('/add', zodValidate(addSchema), asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const product = await ProductModel.findById(productId);
    if (!product || product.status !== 'active')
        throw new NotFoundError('Product not found');
    const wishlist = (await WishlistModel.findOne({ userId: req.auth.sub })) ??
        (await WishlistModel.create({
            userId: req.auth.sub,
            organizationId: req.auth.organizationId,
            productIds: [],
        }));
    const exists = wishlist.productIds.some((id) => id.toString() === productId);
    if (!exists)
        wishlist.productIds.push(new mongoose.Types.ObjectId(productId));
    await wishlist.save();
    auditLog(req, { action: 'wishlist.add', targetType: 'Product', targetId: productId });
    const fresh = await WishlistModel.findById(wishlist._id).populate('productIds').lean();
    envelope.ok(res, fresh?.productIds ?? []);
}));
wishlistRouter.delete('/remove/:productId', asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const wishlist = await WishlistModel.findOne({ userId: req.auth.sub });
    if (!wishlist) {
        envelope.ok(res, []);
        return;
    }
    wishlist.productIds = wishlist.productIds.filter((id) => id.toString() !== productId);
    await wishlist.save();
    auditLog(req, { action: 'wishlist.remove', targetType: 'Product', targetId: productId });
    const fresh = await WishlistModel.findById(wishlist._id).populate('productIds').lean();
    envelope.ok(res, fresh?.productIds ?? []);
}));
wishlistRouter.post('/clear', asyncHandler(async (req, res) => {
    const wishlist = await WishlistModel.findOne({ userId: req.auth.sub });
    if (!wishlist) {
        envelope.ok(res, { cleared: true });
        return;
    }
    wishlist.productIds = [];
    await wishlist.save();
    auditLog(req, { action: 'wishlist.clear', targetType: 'Wishlist', targetId: wishlist._id.toString() });
    envelope.ok(res, { cleared: true });
}));
