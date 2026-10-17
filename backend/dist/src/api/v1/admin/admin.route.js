import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { UserModel } from '../users/user.model.js';
import { ProductModel } from '../products/product.model.js';
import { OrderModel } from '../orders/order.model.js';
import { addCategory, bulkUpdateCategoryList, deleteCategory, editCategory, listAllCategories, reorderCategoryList, toggleVisibility, } from '../categories/admin-category.controller.js';
import { bulkUpdateSchema, categoryCreateSchema, categoryWriteSchema, reorderSchema, visibilitySchema, } from '../categories/category.service.js';
import { addOrderNote, bulkOrderSchema, bulkUpdateOrders, emailCustomerSchema, emailOrderCustomer, exportUsersCsv, getAdminOrder, getAdminUser, getOrderAnalytics, invoicePayload, listAdminOrders, listAdminUsers, orderNoteSchema, updateAdminUser, updateOrderStatus, updateOrderStatusSchema, } from '../orders/admin-order.service.js';
import { auditLog } from '../../../core/logging/audit.js';
import { emitRealtime } from '../../../core/realtime/hub.js';
const updateUserSchema = z.object({
    isBlocked: z.boolean().optional(),
    role: z.enum(['customer', 'store_admin', 'platform_admin', 'user', 'admin']).optional(),
    phone: z.string().trim().max(40).optional(),
    name: z.string().trim().min(1).max(120).optional(),
});
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin'));
adminRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const range = String(req.query.range || 'daily');
    const chartRange = ['daily', 'weekly', 'monthly'].includes(range) ? range : 'daily';
    const lowStockFilter = {
        status: 'active',
        stock: { $gt: 0 },
        $expr: {
            $lte: ['$stock', { $ifNull: ['$stockAlertThreshold', { $ifNull: ['$lowStockThreshold', 5] }] }],
        },
    };
    const [users, products, orders, lowStockCount, lowStockProducts, outOfStockCount, analytics] = await Promise.all([
        UserModel.countDocuments({ role: 'customer' }),
        ProductModel.countDocuments({ status: 'active' }),
        OrderModel.countDocuments(),
        ProductModel.countDocuments(lowStockFilter),
        ProductModel.find(lowStockFilter)
            .select('title name slug image stock stockStatus lowStockThreshold stockAlertThreshold')
            .sort({ stock: 1 })
            .limit(20)
            .lean(),
        ProductModel.countDocuments({ status: 'active', stock: { $lte: 0 } }),
        getOrderAnalytics(chartRange),
    ]);
    envelope.ok(res, {
        users,
        products,
        orders,
        lowStockCount,
        outOfStockCount,
        lowStockProducts,
        analytics,
    });
}));
adminRouter.get('/stats', asyncHandler(async (req, res) => {
    const range = String(req.query.range || 'daily');
    const chartRange = ['daily', 'weekly', 'monthly'].includes(range) ? range : 'daily';
    const analytics = await getOrderAnalytics(chartRange);
    const [revenueAgg, pendingOrders, deliveredOrders] = await Promise.all([
        OrderModel.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        OrderModel.countDocuments({ status: { $in: ['pending'] } }),
        OrderModel.countDocuments({ status: { $in: ['delivered', 'completed'] } }),
    ]);
    envelope.ok(res, {
        revenue: revenueAgg[0]?.total ?? 0,
        pendingOrders,
        deliveredOrders,
        analytics,
    });
}));
adminRouter.get('/analytics/orders', asyncHandler(async (req, res) => {
    const range = String(req.query.range || 'daily');
    const chartRange = ['daily', 'weekly', 'monthly'].includes(range) ? range : 'daily';
    const analytics = await getOrderAnalytics(chartRange);
    envelope.ok(res, analytics);
}));
adminRouter.get('/orders', asyncHandler(async (req, res) => {
    const data = await listAdminOrders(req.query);
    envelope.ok(res, data);
}));
adminRouter.post('/orders/bulk', zodValidate(bulkOrderSchema), asyncHandler(async (req, res) => {
    const result = await bulkUpdateOrders(req.body, {
        id: req.auth?.sub,
        name: req.auth?.email || 'Admin',
    });
    auditLog(req, { action: 'admin.order.bulk', targetType: 'Order', metadata: { updated: result.updated } });
    envelope.ok(res, result);
}));
adminRouter.get('/orders/:id', asyncHandler(async (req, res) => {
    const order = await getAdminOrder(String(req.params.id));
    envelope.ok(res, order);
}));
adminRouter.put('/orders/:id/status', zodValidate(updateOrderStatusSchema), asyncHandler(async (req, res) => {
    const order = await updateOrderStatus(String(req.params.id), req.body, {
        id: req.auth?.sub,
        name: req.auth?.email || 'Admin',
    });
    auditLog(req, {
        action: 'admin.order.status',
        targetType: 'Order',
        targetId: String(order._id || req.params.id),
    });
    emitRealtime('admin:stats', { message: 'Order status changed' }, ['admin']);
    envelope.ok(res, order);
}));
adminRouter.post('/orders/:id/notes', zodValidate(orderNoteSchema), asyncHandler(async (req, res) => {
    const order = await addOrderNote(String(req.params.id), req.body.body, {
        id: req.auth?.sub,
        name: req.auth?.email || 'Admin',
    });
    envelope.ok(res, order);
}));
adminRouter.post('/orders/:id/email', zodValidate(emailCustomerSchema), asyncHandler(async (req, res) => {
    const result = await emailOrderCustomer(String(req.params.id), req.body);
    envelope.ok(res, result);
}));
adminRouter.get('/orders/:id/invoice', asyncHandler(async (req, res) => {
    const invoice = await invoicePayload(String(req.params.id));
    envelope.ok(res, invoice);
}));
adminRouter.get('/users', asyncHandler(async (req, res) => {
    const data = await listAdminUsers(req.query);
    envelope.ok(res, data);
}));
adminRouter.get('/users/export', asyncHandler(async (_req, res) => {
    const file = await exportUsersCsv();
    envelope.ok(res, file);
}));
adminRouter.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await getAdminUser(String(req.params.id));
    envelope.ok(res, user);
}));
adminRouter.patch('/users/:id', zodValidate(updateUserSchema), asyncHandler(async (req, res) => {
    const body = req.body;
    const role = body.role === 'user' ? 'customer' : body.role === 'admin' ? 'store_admin' : body.role;
    const user = await updateAdminUser(String(req.params.id), {
        isBlocked: body.isBlocked,
        phone: body.phone,
        name: body.name,
        role,
    });
    auditLog(req, {
        action: 'admin.user.update',
        targetType: 'User',
        targetId: String(user._id || req.params.id),
    });
    envelope.ok(res, user);
}));
adminRouter.get('/products', asyncHandler(async (req, res) => {
    const filter = {};
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const stockStatus = typeof req.query.stockStatus === 'string' ? req.query.stockStatus : '';
    if (search) {
        const pattern = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        filter.$or = [{ title: pattern }, { name: pattern }, { tags: pattern }];
    }
    if (['in_stock', 'low_stock', 'out_of_stock'].includes(stockStatus))
        filter.stockStatus = stockStatus;
    const products = await ProductModel.find(filter).sort({ stock: 1, createdAt: -1 }).lean();
    envelope.ok(res, products);
}));
adminRouter.get('/inventory', asyncHandler(async (_req, res) => {
    const products = await ProductModel.find({ status: { $ne: 'archived' } })
        .select('title name slug image stock stockStatus lowStockThreshold stockAlertThreshold status')
        .sort({ stock: 1, title: 1 })
        .lean();
    envelope.ok(res, products);
}));
adminRouter.get('/categories', asyncHandler(listAllCategories));
adminRouter.post('/categories', zodValidate(categoryCreateSchema), asyncHandler(addCategory));
adminRouter.put('/categories/reorder', zodValidate(reorderSchema), asyncHandler(reorderCategoryList));
adminRouter.put('/categories/bulk', zodValidate(bulkUpdateSchema), asyncHandler(bulkUpdateCategoryList));
adminRouter.patch('/categories/:id/visibility', zodValidate(visibilitySchema), asyncHandler(toggleVisibility));
adminRouter.put('/categories/:id', zodValidate(categoryWriteSchema), asyncHandler(editCategory));
adminRouter.delete('/categories/:id', asyncHandler(deleteCategory));
