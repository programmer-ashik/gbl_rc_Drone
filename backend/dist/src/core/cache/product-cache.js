import mongoose from 'mongoose';
import { NotFoundError } from '../http/errors.js';
import { ProductModel } from '../../api/v1/products/product.model.js';
import { CACHE_KEYS, CACHE_TTL } from './keys.js';
import { cacheReadThrough } from './redis.js';
export const getCachedFeaturedProducts = async () => cacheReadThrough(CACHE_KEYS.PRODUCTS_FEATURED, CACHE_TTL.PRODUCTS, async () => ProductModel.find({
    status: 'active',
    $or: [{ isFeatured: true }, { isBestSeller: true }],
})
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
    .limit(12)
    .lean());
export const getCachedNewProducts = async () => cacheReadThrough(CACHE_KEYS.PRODUCTS_NEW, CACHE_TTL.PRODUCTS, async () => ProductModel.find({ status: 'active', isNewArrival: true }).sort({ createdAt: -1 }).limit(12).lean());
export const getCachedProductDetail = async (idOrSlug) => {
    const key = CACHE_KEYS.productDetail(idOrSlug.toLowerCase());
    return cacheReadThrough(key, CACHE_TTL.PRODUCTS, async () => {
        const product = mongoose.Types.ObjectId.isValid(idOrSlug)
            ? await ProductModel.findById(idOrSlug)
                .populate('comboItems.productId', 'title name slug image stock stockStatus')
                .populate('compatibleWith.productIds', 'title name slug image')
                .lean()
            : await ProductModel.findOne({ slug: idOrSlug.toLowerCase() })
                .populate('comboItems.productId', 'title name slug image stock stockStatus')
                .populate('compatibleWith.productIds', 'title name slug image')
                .lean();
        if (!product || product.status === 'archived')
            throw new NotFoundError('Product not found');
        // Also seed the alternate key (id <-> slug) for faster invalidation coverage on next read
        const altKey = mongoose.Types.ObjectId.isValid(idOrSlug) && product.slug
            ? CACHE_KEYS.productDetail(String(product.slug).toLowerCase())
            : CACHE_KEYS.productDetail(String(product._id));
        if (altKey !== key) {
            const { cacheSetJson } = await import('./redis.js');
            await cacheSetJson(altKey, product, CACHE_TTL.PRODUCTS);
        }
        return product;
    });
};
