import { config } from '../../config/env.js';
/** Canonical cache keys (also clear legacy nav:* aliases on invalidate). */
export const CACHE_KEYS = {
    CATEGORIES_TREE: 'categories:tree',
    CATEGORIES_NAV: 'categories:nav',
    CATEGORIES_FOOTER: 'categories:footer',
    PRODUCTS_FEATURED: 'products:featured',
    PRODUCTS_NEW: 'products:new',
    productDetail: (idOrSlug) => `products:detail:${idOrSlug}`,
};
export const LEGACY_NAV_KEYS = ['nav:categories:tree', 'nav:categories:menu', 'nav:categories:footer'];
/** 1 hour for categories, 30 minutes for product lists / details */
export const CACHE_TTL = {
    CATEGORIES: Math.max(config.CATEGORY_CACHE_TTL, 60),
    PRODUCTS: Math.max(config.PRODUCT_CACHE_TTL, 60),
};
