import { CACHE_KEYS, CACHE_TTL, LEGACY_NAV_KEYS } from './keys.js';
import { cacheDel, cacheDelByPrefix } from './redis.js';
import { emitRealtime } from '../realtime/hub.js';
export const invalidateCategoryCaches = async (meta = {}) => {
    await cacheDel(CACHE_KEYS.CATEGORIES_TREE, CACHE_KEYS.CATEGORIES_NAV, CACHE_KEYS.CATEGORIES_FOOTER, ...LEGACY_NAV_KEYS);
    emitRealtime('catalog:categories', { message: 'Categories updated', ...meta }, ['storefront', 'admin']);
};
export const invalidateProductListCaches = async (meta = {}) => {
    await cacheDel(CACHE_KEYS.PRODUCTS_FEATURED, CACHE_KEYS.PRODUCTS_NEW);
    emitRealtime('catalog:products', { message: 'Products updated', ...meta }, ['storefront', 'admin']);
};
export const invalidateProductDetailCaches = async (refs = [], meta = {}) => {
    const keys = [...new Set(refs.filter(Boolean).map((ref) => CACHE_KEYS.productDetail(String(ref))))];
    if (keys.length)
        await cacheDel(...keys);
    emitRealtime('admin:stock', { message: 'Stock updated', productIds: refs.filter(Boolean), ...meta }, ['admin', 'storefront']);
};
/** Full product write: lists + optional detail keys */
export const invalidateProductCaches = async (refs = [], meta = {}) => {
    await invalidateProductListCaches(meta);
    await invalidateProductDetailCaches(refs, meta);
};
export const invalidateAllProductDetailCaches = async () => {
    await cacheDelByPrefix('products:detail:');
};
export const notifyNewOrder = (order) => {
    emitRealtime('admin:order', {
        message: 'New order received',
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
    }, ['admin']);
    emitRealtime('admin:stats', { message: 'Dashboard stats changed' }, ['admin']);
};
export const notifyLowStock = (products) => {
    if (!products.length)
        return;
    emitRealtime('admin:low-stock', {
        message: 'Low stock alert',
        products: products.map((product) => ({
            id: product._id,
            title: product.title || product.name,
            stock: product.stock,
            stockStatus: product.stockStatus,
        })),
    }, ['admin']);
};
export { CACHE_KEYS, CACHE_TTL };
