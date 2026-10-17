import mongoose from 'mongoose';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth } from '../../../core/auth/middleware.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/http/errors.js';
import { ReviewModel } from './review.model.js';
import { ProductModel } from '../products/product.model.js';
import { auditLog } from '../../../core/logging/audit.js';
const reviewSchema = z.object({
    productId: z.string().min(1),
    rating: z.number().min(1).max(5),
    comment: z.string().optional().default(''),
});
const reviewUpdateSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
});
export const reviewsRouter = Router();
reviewsRouter.get('/:productId', asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const items = await ReviewModel.find({ productId }).populate('userId', 'name').sort({ createdAt: -1 }).lean();
    envelope.ok(res, items);
}));
reviewsRouter.post('/', requireAuth, zodValidate(reviewSchema), asyncHandler(async (req, res) => {
    const { productId, rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId))
        throw new BadRequestError('Invalid product id');
    const product = await ProductModel.findById(productId);
    if (!product || product.status !== 'active')
        throw new NotFoundError('Product not found');
    const review = await ReviewModel.findOneAndUpdate({ productId, userId: req.auth.sub }, {
        productId,
        userId: req.auth.sub,
        organizationId: req.auth.organizationId,
        rating,
        comment,
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const stats = await ReviewModel.aggregate([
        { $match: { productId: product._id } },
        { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avgRating = stats[0]?.avgRating ?? 0;
    const count = stats[0]?.count ?? 0;
    await ProductModel.findByIdAndUpdate(productId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: count,
    });
    auditLog(req, { action: 'review.upsert', targetType: 'Review', targetId: review._id.toString() });
    envelope.ok(res, review);
}));
reviewsRouter.put('/:id', requireAuth, zodValidate(reviewUpdateSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid review id');
    const review = await ReviewModel.findById(id);
    if (!review)
        throw new NotFoundError('Review not found');
    if (review.userId.toString() !== req.auth.sub) {
        throw new ForbiddenError('Review access denied');
    }
    Object.assign(review, req.body);
    await review.save();
    auditLog(req, { action: 'review.update', targetType: 'Review', targetId: review._id.toString() });
    envelope.ok(res, review);
}));
reviewsRouter.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestError('Invalid review id');
    const review = await ReviewModel.findById(id);
    if (!review)
        throw new NotFoundError('Review not found');
    if (review.userId.toString() !== req.auth.sub) {
        throw new ForbiddenError('Review access denied');
    }
    await ReviewModel.deleteOne({ _id: review._id });
    auditLog(req, { action: 'review.delete', targetType: 'Review', targetId: review._id.toString() });
    envelope.ok(res, { deleted: true });
}));
