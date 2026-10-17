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
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional().default(''),
  images: z.array(z.string().min(1)).max(5).optional().default([]),
});

const reviewUpdateSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  images: z.array(z.string().min(1)).max(5).optional(),
});

const refreshProductRating = async (productId: string | mongoose.Types.ObjectId) => {
  const oid = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  const stats = await ReviewModel.aggregate([
    { $match: { productId: oid } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avgRating = stats[0]?.avgRating ?? 0;
  const count = stats[0]?.count ?? 0;
  await ProductModel.findByIdAndUpdate(oid, {
    rating: Math.round(avgRating * 10) / 10,
    reviewsCount: count,
  });
};

export const reviewsRouter = Router();

reviewsRouter.get(
  '/:productId',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const sort = String(req.query.sort || 'newest');
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new BadRequestError('Invalid product id');
    const sortSpec =
      sort === 'helpful'
        ? { helpfulCount: -1 as const, createdAt: -1 as const }
        : sort === 'rating'
          ? { rating: -1 as const, createdAt: -1 as const }
          : { createdAt: -1 as const };
    const items = await ReviewModel.find({ productId })
      .populate('userId', 'name')
      .sort(sortSpec)
      .lean();
    envelope.ok(res, items);
  }),
);

reviewsRouter.post(
  '/',
  requireAuth,
  zodValidate(reviewSchema),
  asyncHandler(async (req, res) => {
    const { productId, rating, comment, images } = req.body as z.infer<typeof reviewSchema>;
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new BadRequestError('Invalid product id');
    const product = await ProductModel.findById(productId);
    if (!product || product.status !== 'active') throw new NotFoundError('Product not found');

    const review = await ReviewModel.findOneAndUpdate(
      { productId, userId: req.auth!.sub },
      {
        productId,
        userId: req.auth!.sub,
        organizationId: req.auth!.organizationId,
        rating,
        comment,
        images: images || [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await refreshProductRating(productId);
    auditLog(req, { action: 'review.upsert', targetType: 'Review', targetId: review._id.toString() });
    envelope.ok(res, review);
  }),
);

reviewsRouter.post(
  '/:id/helpful',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid review id');
    const review = await ReviewModel.findById(id);
    if (!review) throw new NotFoundError('Review not found');
    const userId = req.auth!.sub;
    const already = (review.helpfulBy || []).some((entry: any) => entry.toString() === userId);
    if (already) {
      review.helpfulBy = review.helpfulBy.filter((entry: any) => entry.toString() !== userId);
      review.helpfulCount = Math.max(0, (review.helpfulCount || 1) - 1);
    } else {
      review.helpfulBy = [...(review.helpfulBy || []), new mongoose.Types.ObjectId(userId)];
      review.helpfulCount = (review.helpfulCount || 0) + 1;
    }
    await review.save();
    envelope.ok(res, review);
  }),
);

reviewsRouter.put(
  '/:id',
  requireAuth,
  zodValidate(reviewUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid review id');
    const review = await ReviewModel.findById(id);
    if (!review) throw new NotFoundError('Review not found');
    if (review.userId.toString() !== req.auth!.sub) {
      throw new ForbiddenError('Review access denied');
    }

    Object.assign(review, req.body as z.infer<typeof reviewUpdateSchema>);
    await review.save();
    await refreshProductRating(review.productId);
    auditLog(req, { action: 'review.update', targetType: 'Review', targetId: review._id.toString() });
    envelope.ok(res, review);
  }),
);

reviewsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid review id');
    const review = await ReviewModel.findById(id);
    if (!review) throw new NotFoundError('Review not found');
    if (review.userId.toString() !== req.auth!.sub) {
      throw new ForbiddenError('Review access denied');
    }
    const productId = review.productId;
    await ReviewModel.deleteOne({ _id: review._id });
    await refreshProductRating(productId);
    auditLog(req, { action: 'review.delete', targetType: 'Review', targetId: review._id.toString() });
    envelope.ok(res, { deleted: true });
  }),
);
